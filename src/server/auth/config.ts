import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import { db } from "@/server/db";
import { env } from "@/env";
import type { Role } from "@prisma/client";
import { providers } from "./providers";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JWT } from "next-auth/jwt";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      roles: Role[];
      allowedInActiveTerm?: boolean; // whether the user has been added by the coordinator as a participant in this term
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roles?: Role[];
    allowedInActiveTerm?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles?: Role[];
    allowedInActiveTerm?: boolean;
  }
}

/**
 * Extends the shape of the `profile` param in MicrosoftEntraID({ profile(...) })
 * since we get extra info from IT.
 * We do not use these.
 */
declare module "next-auth/providers/microsoft-entra-id" {
  interface MicrosoftEntraIDProfile {
    department?: string;
    title?: string;
    major?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers,
  pages: {
    signIn: "/login",
    error: "/error",
  },
  debug: env.NODE_ENV === "development",
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(db),
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      if (user?.email) {
        token.roles = await getAllowedRolesForEmail(user.email);
      }

      if (token.id) {
        token.allowedInActiveTerm = await computeAllowedInActiveTerm(token.id);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        session.user.roles = token.roles ?? [];
        session.user.allowedInActiveTerm = token.allowedInActiveTerm ?? false;
      }
      return session;
    },

    async signIn({ user, profile }) {
      const email = user?.email ?? profile?.email;
      if (!email) return false;

      return hasEverBeenAllowed(email);
    },
  },

  events: {
    async createUser({ user }) {
      const email = user.email;
      if (!email) return;
      await syncUserRoles(user.id, email);
    },
    async signIn({ user, profile }) {
      const email = user.email ?? profile?.email ?? "";
      if (!email) return;
      await syncUserRoles(user.id, email);
    },
  },
} satisfies NextAuthConfig;

/** Ensure the DB roles align with getAllowedRolesForEmail (esp. coordinator) */
export async function syncUserRoles(userId: string, email: string) {
  const allowed = await getAllowedRolesForEmail(email);
  if (allowed.length === 0) return allowed;

  await db.$transaction(async (tx) => {
    const existing = await tx.userRole.findMany({
      where: { userId },
      select: { role: true },
    });

    const existingSet = new Set(existing.map((e) => e.role));
    const toAdd = allowed.filter((r) => !existingSet.has(r));

    if (toAdd.length) {
      await tx.userRole.createMany({
        data: toAdd.map((role) => ({ userId, role })),
      });
    }

    // remove roles no longer allowed
    await tx.userRole.deleteMany({
      where: { userId, NOT: { role: { in: allowed } } },
    });
  });

  return allowed;
}

function isCoordinatorEmail(email: string) {
  return env.COORDINATOR_EMAILS.includes(email);
}

export async function getAllowedRolesForEmail(email: string): Promise<Role[]> {
  const coordinator = isCoordinatorEmail(email);

  const user = await db.user.findUnique({
    where: { email },
    include: { roles: true },
  });

  // No user record yet
  if (!user) {
    // Let coordinators in even before they have roles in DB
    return coordinator ? (["COORDINATOR"] as Role[]) : [];
  }

  // Base roles from UserRole table
  const roles = user.roles.map((r) => r.role);

  // Add COORDINATOR role if this is a coordinator email
  if (coordinator && !roles.includes("COORDINATOR")) {
    roles.push("COORDINATOR");
  }

  // Dedupe
  return [...new Set(roles)];
}

async function hasEverBeenAllowed(email: string): Promise<boolean> {
  if (isCoordinatorEmail(email)) return true;

  const user = await db.user.findUnique({
    where: { email },
    select: { _count: { select: { AllowedInTerms: true } } },
  });

  if (!user) return false;

  return user._count.AllowedInTerms > 0;
}

async function computeAllowedInActiveTerm(userId: string): Promise<boolean> {
  const activeTerm = await db.term.findFirst({
    where: { active: true, allowedUsers: { some: { id: userId } } },
  });
  if (!activeTerm) return false;
  else return true; // if this term exists, then they are allowed
}
