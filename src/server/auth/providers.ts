import type { Provider } from "next-auth/providers";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { db } from "../db";
import { env } from "@/env";
import { testingPasswordMap } from "./testing-helpers";

const devCredentialsProvider = Credentials({
  id: "credentials",
  name: "credentials",
  credentials: { password: { label: "Password", type: "password" } },
  async authorize(credentials) {
    const pwd = (credentials?.password ?? "") as string;
    if (!pwd) return null;

    if (!(pwd in testingPasswordMap)) return null;
    const roles = testingPasswordMap[pwd];
    if (!roles || roles.length === 0) return null;

    const email = `${pwd}@wpi.edu`;

    const user = await db.$transaction(async (tx) => {
      // Upsert the user and their roles
      const u = await tx.user.upsert({
        where: { email },
        create: {
          email,
          name: pwd,
          roles: { create: roles.map((role) => ({ role })) },
        },
        update: {
          roles: {
            deleteMany: {},
            create: roles.map((role) => ({ role })),
          },
        },
        include: { roles: true },
      });

      return u;
    });

    return {
      ...user,
      roles: user.roles.map((r) => r.role),
    };
  },
});

const microsoftProvider = MicrosoftEntraID({
  clientId: env.AUTH_MICROSOFT_ENTRA_ID_ID,
  clientSecret: env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
  issuer: env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
  async profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
    };
  },
});

export const providers: Provider[] =
  env.NODE_ENV !== "production"
    ? [microsoftProvider, devCredentialsProvider]
    : [microsoftProvider];
