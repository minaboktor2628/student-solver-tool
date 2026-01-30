import { type NextRequest, NextResponse } from "next/server";
import { createNodeSQLiteExecutor } from "@prisma/studio-core/data/node-sqlite";
import { serializeError } from "@prisma/studio-core/data/bff";
import DatabaseSync from "better-sqlite3";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user ?? null;

  if (!user || !hasPermission(user, "studioEndpoint", "call", undefined)) {
    return NextResponse.json([serializeError(new Error("Forbidden"))], {
      status: 403,
    });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        [serializeError(new Error("Query is required"))],
        { status: 400 },
      );
    }

    const url = env.DATABASE_URL;
    if (!url) {
      return NextResponse.json(
        [serializeError(new Error("DATABASE_URL is missing"))],
        { status: 500 },
      );
    }

    // FIX: for some reason, we have to replace it with prisma/ instead of ""
    const dbPath = url.replace("file:", "prisma/");
    const database = new DatabaseSync(dbPath);
    const [error, results] =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await createNodeSQLiteExecutor(database).execute(query);

    if (error) {
      console.error(error);
      return NextResponse.json([serializeError(error)]);
    }

    return NextResponse.json([null, results]);
  } catch (err) {
    console.error(err);
    return NextResponse.json([serializeError(err as Error)], { status: 400 });
  }
}
