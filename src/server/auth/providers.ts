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
    if (!roles) return null;

    const email = `${pwd}@wpi.edu`;

    const user = await db.user.upsert({
      where: { email },
      update: {
        roles: {
          deleteMany: {},
          create: roles.map((role) => ({ role })),
        },
      },
      create: {
        email,
        name: pwd,
        roles: { create: roles.map((role) => ({ role })) },
      },
      include: { roles: true },
    });

    return {
      ...user,
      roles: user.roles.map((r) => r.role),
    };
  },
});

const microsoftProvider = MicrosoftEntraID({});

export const providers: Provider[] =
  env.NODE_ENV !== "production"
    ? [microsoftProvider, devCredentialsProvider]
    : [microsoftProvider];
