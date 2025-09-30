import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { env } from "@/env";
import type { Role } from "@prisma/client";

export const testingPasswordMap: Record<string, Role[]> = {
  testpla: ["PLA"],
  testta: ["TA"],
  testprof: ["PROFESSOR"],
  testcoordinator: ["PROFESSOR", "COORDINATOR"],
} as const;

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
 * */
declare module "next-auth/providers/microsoft-entra-id" {
  interface MicrosoftEntraIDProfile {
    department?: string;
    title?: string;
    major?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
const providers: NextAuthConfig["providers"] = [
  MicrosoftEntraID({
    async profile(profile, tokens) {
      // https://learn.microsoft.com/en-us/graph/api/profilephoto-get?view=graph-rest-1.0&tabs=http#examples
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/photos/120x120/$value`,
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );

      // Confirm that profile photo was returned
      let image: string | null = null;
      // TODO: Do this without Buffer
      if (response.ok && typeof Buffer !== "undefined") {
        try {
          const pictureBuffer = await response.arrayBuffer();
          const pictureBase64 = Buffer.from(pictureBuffer).toString("base64");
          image = `data:image/jpeg;base64, ${pictureBase64}`;
        } catch {}
      }

      const roles: Role[] = [];

      // Is this a coordinator? (defined in environment variable)
      if (env.COORDINATOR_EMAILS.includes(profile.email)) {
        roles.push("COORDINATOR");
      }

      // Is this a professor?
      if (
        profile.department === "Computer Science" &&
        /Professor|Instructor/.test(profile.title ?? "")
      ) {
        roles.push("PROFESSOR");
      }

      // Is this a student assistant?
      if (profile.department === "Student Employment") {
        // Is this a TA?
        if ((profile?.title ?? "").startsWith("Teaching Assistant")) {
          roles.push("TA");
        }
        // Is this a PLA?
        if ((profile?.title ?? "").startsWith("Peer Learning Assistant - CS")) {
          roles.push("PLA");
        }
      }

      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image,
        roles,
      };
    },
  }),
  ...(env.NODE_ENV === "development"
    ? [
        Credentials({
          id: "credentials",
          name: "credentials",
          credentials: {
            password: { label: "Password", type: "password" },
          },

          async authorize(credentials) {
            const pwd = (credentials?.password ?? "") as string;
            if (!pwd) return null;

            if (!(pwd in testingPasswordMap)) return null;
            const roles = testingPasswordMap[pwd];
            if (!roles) return null;

            const email = `${pwd}@wpi.edu`;

            const user = await db.user.upsert({
              where: { email },
              update: { roles: { set: roles } },
              create: {
                email,
                name: pwd,
                image:
                  "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
                roles,
              },
            });

            return user;
          },
        }),
      ]
    : []),
];

export const authConfig = {
  providers,
  debug: env.NODE_ENV === "development",
  session: { strategy: env.NODE_ENV === "development" ? "jwt" : "database" },
  adapter: PrismaAdapter(db),
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow users with at least one role
      return Array.isArray(user.roles && user.roles.length > 0);
    },
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
        session.user.roles = roles;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
