import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import { db } from "@/server/db";
import { env } from "@/env";
import type { Role } from "@prisma/client";
import { providers } from "./providers";

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
    roles: Role[];
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
    signIn: "/signin",
    error: "/error",
  },
  debug: env.NODE_ENV === "development",
  session: { strategy: env.NODE_ENV !== "production" ? "jwt" : "database" },
  adapter: PrismaAdapter(db),
  callbacks: {
    // async signIn({ user }) {
    //   // Only allow users with at least one role
    //   return Array.isArray(user.roles) && user.roles.length > 0;
    // },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles ?? [];
      }
      return token;
    },
    async session({ session, token, user }) {
      const id = user?.id ?? token?.id;
      const roles = user?.roles ?? token?.roles ?? [];
      if (session.user) {
        session.user.id = id;
        session.user.roles = ["COORDINATOR"];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
