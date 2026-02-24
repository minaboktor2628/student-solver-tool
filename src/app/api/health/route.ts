import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  try {
    // lightweight DB ping
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: "Database connection failed",
      },
      { status: 500 },
    );
  }
}
