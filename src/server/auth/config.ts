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
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roles?: Role[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles?: Role[];
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
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        session.user.roles = token.roles ?? [];
      }
      return session;
    },

    async signIn({ user, profile }) {
      const email = user?.email ?? profile?.email;
      if (!email) return false;
      const allowed = await getAllowedRolesForEmail(email);
      return allowed.length > 0;
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

export async function getAllowedRolesForEmail(email: string) {
  // Pull the roles this email is allowed to have from db
  const allowed = await db.allowedEmail
    .findMany({
      where: { email },
      select: { role: true },
    })
    .then((entries) => entries.map((entry) => entry.role));

  // Append coordinator role (from env, not in db)
  if (env.COORDINATOR_EMAILS.includes(email)) {
    allowed.push("COORDINATOR");
  }

  // dedupe
  return [...new Set(allowed)];
}

/** Assign roles to a user (create missing, remove extras) */
export async function syncUserRoles(userId: string, email: string) {
  const allowed = await getAllowedRolesForEmail(email);
  if (allowed.length === 0) return allowed;

  await db.$transaction(async (tx) => {
    // remove roles no longer allowed
    await tx.userRole.deleteMany({
      where: { userId, NOT: { role: { in: allowed } } },
    });

    // add missing roles
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
  });

  return allowed;
}
