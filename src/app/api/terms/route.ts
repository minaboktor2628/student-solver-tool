export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const termId = searchParams.get("id");

    if (!termId) {
      return NextResponse.json(
        { error: "Term ID is required" },
        { status: 400 },
      );
    }

    console.log("=== TERM DELETION START ===");
    console.log("Deleting term:", termId);

    // Delete the term (cascade will handle related records)
    await prisma.term.delete({
      where: { id: termId },
    });

    console.log("✅ Term deleted successfully");
    console.log("=== TERM DELETION COMPLETE ===");

    return NextResponse.json({
      success: true,
      message: "Term deleted successfully",
    });
  } catch (error: any) {
    console.error("=== TERM DELETION FAILED ===");
    console.error("Error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete term",
        details: error.message,
      },
      { status: 500 },
    );
  }
} // src/app/api/terms/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Calculate required hours based on enrollment
function calculateRequiredHours(enrollment: number): number {
  // Round enrollment up to nearest 5
  const roundedUp = Math.ceil(enrollment / 5) * 5;
  // Divide by 2
  const divided = roundedUp / 2;
  // Round down to nearest 10
  const requiredHours = Math.floor(divided / 10) * 10;
  return requiredHours;
}

export async function GET() {
  try {
    const terms = await prisma.term.findMany({
      include: {
        sections: true,
        allowedEmails: true,
      },
      orderBy: [{ year: "desc" }, { termLetter: "desc" }],
    });

    return NextResponse.json({
      terms: terms.map((term) => ({
        id: term.id,
        name: `${term.termLetter} ${term.year}`,
        termLetter: term.termLetter,
        year: term.year,
        staffDueDate: term.termStaffDueDate.toISOString(),
        professorDueDate: term.termProfessorDueDate.toISOString(),
        courseCount: term.sections.length,
        peopleCount: term.allowedEmails.length,
      })),
    });
  } catch (error) {
    console.error("Error fetching terms:", error);
    return NextResponse.json(
      { error: "Failed to fetch terms" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("=== TERM CREATION START ===");
    console.log("Request body received:", JSON.stringify(body, null, 2));

    const {
      termLetter,
      year,
      staffDueDate,
      professorDueDate,
      csvData,
      courses,
    } = body;

    // Validate required fields
    if (!termLetter || !year || !staffDueDate || !professorDueDate) {
      console.error("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log("Creating term with:", {
      termLetter,
      year,
      staffDueDate,
      professorDueDate,
    });

    // Create term
    const term = await prisma.term.create({
      data: {
        termLetter,
        year: parseInt(year),
        termStaffDueDate: new Date(staffDueDate),
        termProfessorDueDate: new Date(professorDueDate),
      },
    });

    console.log("✅ Term created:", term.id);

    // Create allowed emails
    if (csvData && Array.isArray(csvData)) {
      console.log("Creating allowed emails:", csvData.length);
      for (const row of csvData) {
        try {
          await prisma.allowedEmail.create({
            data: {
              email: row.email,
              role: row.role,
              termId: term.id,
            },
          });
          console.log("✅ Created allowed email:", row.email);
        } catch (emailError) {
          console.error(
            "❌ Error creating allowed email:",
            row.email,
            emailError,
          );
        }
      }
    } else {
      console.log("No CSV data provided");
    }

    // Create sections
    if (courses && Array.isArray(courses) && courses.length > 0) {
      console.log("Creating sections:", courses.length);
      for (const course of courses) {
        try {
          console.log(
            "Processing course:",
            course.courseCode,
            "Professor:",
            course.professorName,
          );

          // Find or create the professor user using the course's professor name
          let professorUser = await prisma.user.findFirst({
            where: {
              name: { contains: course.professorName },
            },
          });

          if (!professorUser) {
            console.log(
              "Creating new professor user for:",
              course.professorName,
            );
            professorUser = await prisma.user.create({
              data: {
                email: `${course.professorName.toLowerCase().replace(/\s+/g, ".")}@wpi.edu`,
                name: course.professorName,
                roles: {
                  create: {
                    role: "PROFESSOR",
                  },
                },
              },
            });
            console.log("✅ Created professor user:", professorUser.id);
          }

          // Calculate required hours based on enrollment
          const calculatedHours = calculateRequiredHours(
            course.enrollment || 0,
          );
          console.log(
            `Enrollment: ${course.enrollment}, Calculated hours: ${calculatedHours}`,
          );

          // Create the section
          await prisma.section.create({
            data: {
              termId: term.id,
              courseTitle: course.courseTitle,
              courseCode: course.courseCode,
              description:
                course.description ||
                `${course.courseCode} - ${course.courseTitle}`,
              professorId: professorUser.id,
              enrollment: course.enrollment || 0,
              capacity: course.capacity || 0,
              requiredHours: calculatedHours, // Use calculated hours
              academicLevel: "UNDERGRADUATE",
            },
          });
          console.log("✅ Created section:", course.courseCode);
        } catch (courseError) {
          console.error(
            "❌ Error creating section for course:",
            course.courseCode,
            courseError,
          );
        }
      }
    } else {
      console.log("No courses provided for sections");
    }

    console.log("=== TERM CREATION COMPLETE ===");
    return NextResponse.json({
      success: true,
      termId: term.id,
      message: `Term created successfully`,
    });
  } catch (error: any) {
    console.error("=== TERM CREATION FAILED ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);

    return NextResponse.json(
      {
        error: "Failed to create term",
        details: error.message,
        code: error.code,
        meta: error.meta,
      },
      { status: 500 },
    );
  }
}
