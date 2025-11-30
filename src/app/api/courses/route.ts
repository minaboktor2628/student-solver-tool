import { NextResponse } from "next/server";
import { syncCourses } from "@/scripts/syncCourses";

export async function POST() {
  try {
    const result = await syncCourses();
    return NextResponse.json({
      success: true,
      message: "Course sync completed",
      ...result,
    });
  } catch (error) {
    console.error("Error syncing courses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
