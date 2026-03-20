import "server-only";
import { env } from "@/env";
import { PrismaClient } from "@/prisma/generated/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: env.DATABASE_URL,
});

const createPrismaClient = () =>
  new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["error", "warn", "info" /* "query" */]
        : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
