import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get the most recent term
    const latestTerm = await db.term.findFirst({
      orderBy: [{ year: "desc" }, { termLetter: "desc" }],
    });

    if (!latestTerm) {
      return NextResponse.json({
        courses: [],
        staff: [],
        professors: [],
        currentTerm: "No Term",
      });
    }

    // Fetch courses for the current term
    const sections = await db.section.findMany({
      where: {
        termId: latestTerm.id,
      },
      include: {
        professor: true,
        assignments: {
          include: {
            staff: true,
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: {
        courseCode: "asc",
      },
    });

    // Fetch all staff with their preferences for this term
    const staffUsers = await db.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              in: ["PLA", "TA"],
            },
          },
        },
      },
      include: {
        roles: true,
        staffPreferences: {
          where: {
            termId: latestTerm.id,
          },
        },
      },
    });

    // Fetch all professors
    const professorUsers = await db.user.findMany({
      where: {
        roles: {
          some: {
            role: "PROFESSOR",
          },
        },
      },
      include: {
        teaches: {
          where: {
            termId: latestTerm.id,
          },
          include: {
            professorPreference: true,
          },
        },
      },
    });

    // Transform courses
    const courses = sections.map((section) => {
      const assignedHours = section.assignments.reduce((sum, assignment) => {
        return sum + (assignment.staff.hours || 0);
      }, 0);

      return {
        id: section.id,
        courseCode: section.courseCode,
        courseTitle: section.courseTitle,
        enrollment: section.enrollment,
        capacity: section.capacity,
        requiredHours: section.requiredHours,
        assignedStaff: assignedHours,
        professorName: section.professor.name || "Unknown",
        term: `${latestTerm.termLetter} Term ${latestTerm.year}`,
      };
    });

    // Transform staff
    const staff = staffUsers.map((user) => {
      const role =
        user.roles.find((r) => r.role === "PLA" || r.role === "TA")?.role ||
        "PLA";
      const hasPreference = user.staffPreferences.length > 0;

      return {
        id: user.id,
        name: user.name || "Unknown",
        email: user.email || "",
        role,
        submitted: hasPreference,
        hours: user.hours || 0,
      };
    });

    // Transform professors
    const professors = professorUsers.map((user) => {
      const coursesTeaching = user.teaches;
      const hasSubmittedAll = coursesTeaching.every(
        (course) => course.professorPreference !== null,
      );

      return {
        id: user.id,
        name: user.name || "Unknown",
        email: user.email || "",
        submitted: hasSubmittedAll && coursesTeaching.length > 0,
        courseCount: coursesTeaching.length,
      };
    });

    return NextResponse.json({
      courses,
      staff,
      professors,
      currentTerm: `${latestTerm.termLetter} Term ${latestTerm.year}`,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
