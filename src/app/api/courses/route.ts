import { NextRequest, NextResponse } from "next/server";
import { syncCourses } from "@/scripts/syncCourses";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Calculate required hours based on enrollment (same as in page.tsx)
function calculateRequiredHours(enrollment: number): number {
  // Round enrollment up to nearest 5
  const roundedUp = Math.ceil(enrollment / 5) * 5;
  // Divide by 2
  const divided = roundedUp / 2;
  // Round down to nearest 10
  const requiredHours = Math.floor(divided / 10) * 10;
  return requiredHours;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("id");

    // If ID is provided, get single course
    if (courseId) {
      const course = await prisma.section.findUnique({
        where: { id: courseId },
        include: {
          professor: true,
          term: true,
          assignments: {
            include: {
              staff: true,
            },
          },
        },
      });

      if (!course) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        course: {
          id: course.id,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          professorName: course.professor?.name || "Unknown Professor",
          professorId: course.professorId,
          enrollment: course.enrollment,
          capacity: course.capacity,
          requiredHours: course.requiredHours,
          assignedStaff: course.assignments.reduce(
            (sum, assignment) => sum + (assignment.staff?.hours || 0),
            0,
          ),
          term: course.term
            ? `${course.term.termLetter} ${course.term.year}`
            : "Unknown Term",
          academicLevel: course.academicLevel,
          description: course.description,
        },
      });
    }

    // Otherwise, get all courses
    const courses = await prisma.section.findMany({
      include: {
        professor: true,
        term: true,
        assignments: {
          include: {
            staff: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      courses: courses.map((course) => ({
        id: course.id,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        professorName: course.professor?.name || "Unknown Professor",
        professorEmail: course.professor?.email || "",
        enrollment: course.enrollment,
        capacity: course.capacity,
        requiredHours: course.requiredHours,
        assignedStaff: course.assignments.reduce(
          (sum, assignment) => sum + (assignment.staff?.hours || 0),
          0,
        ),
        term: course.term
          ? `${course.term.termLetter} ${course.term.year}`
          : "Unknown Term",
        academicLevel: course.academicLevel,
      })),
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");

    // If it's a JSON request, it's for manual course addition
    if (contentType?.includes("application/json")) {
      const body = await request.json();

      // Check if it's a sync request (has term parameter)
      if (body.term) {
        const result = await syncCourses();
        return NextResponse.json({
          success: true,
          message: "Course sync completed",
          ...result,
        });
      }

      // Otherwise, it's a manual course addition
      const { courses, termId } = body;

      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        return NextResponse.json(
          { success: false, error: "No courses provided" },
          { status: 400 },
        );
      }

      const createdCourses = [];

      for (const courseData of courses) {
        const { courseCode, courseTitle, professorName, enrollment, capacity } =
          courseData;

        // Find or create professor
        let professor = await prisma.user.findFirst({
          where: {
            name: { contains: professorName },
            roles: {
              some: { role: "PROFESSOR" },
            },
          },
        });

        if (!professor) {
          professor = await prisma.user.create({
            data: {
              email: `${professorName.toLowerCase().replace(/\s+/g, ".")}@wpi.edu`,
              name: professorName,
              roles: {
                create: {
                  role: "PROFESSOR",
                },
              },
            },
          });
        }

        // Calculate required hours
        const requiredHours = calculateRequiredHours(enrollment || 0);

        // Create course
        const course = await prisma.section.create({
          data: {
            courseCode,
            courseTitle,
            enrollment: enrollment || 0,
            capacity: capacity || 0,
            requiredHours,
            professorId: professor.id,
            termId: termId || null,
            academicLevel: "UNDERGRADUATE",
            description: `${courseCode} - ${courseTitle}`,
          },
        });

        createdCourses.push(course);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully added ${createdCourses.length} course(s)`,
        courses: createdCourses,
      });
    } else {
      // No JSON body, so it's a sync request from the UI button
      const result = await syncCourses();
      return NextResponse.json({
        success: true,
        message: "Course sync completed",
        ...result,
      });
    }
  } catch (error) {
    console.error("Error in courses POST:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      courseCode,
      courseTitle,
      professorName,
      enrollment,
      capacity,
      requiredHours,
    } = body;

    // Validate required fields
    if (!courseCode || !courseTitle || !professorName) {
      return NextResponse.json(
        { error: "Course code, title, and professor name are required" },
        { status: 400 },
      );
    }

    // Find or create the professor
    let professor = await prisma.user.findFirst({
      where: {
        name: { contains: professorName },
        roles: {
          some: { role: "PROFESSOR" },
        },
      },
    });

    if (!professor) {
      professor = await prisma.user.create({
        data: {
          email: `${professorName.toLowerCase().replace(/\s+/g, ".")}@wpi.edu`,
          name: professorName,
          roles: {
            create: {
              role: "PROFESSOR",
            },
          },
        },
      });
    }

    // Calculate hours if not provided
    const calculatedHours =
      requiredHours || calculateRequiredHours(enrollment || 0);

    // Update the course
    const updatedCourse = await prisma.section.update({
      where: { id: courseId },
      data: {
        courseCode,
        courseTitle,
        professorId: professor.id,
        enrollment: enrollment || 0,
        capacity: capacity || 0,
        requiredHours: calculatedHours,
      },
      include: {
        professor: true,
        assignments: {
          include: {
            staff: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      course: {
        id: updatedCourse.id,
        courseCode: updatedCourse.courseCode,
        courseTitle: updatedCourse.courseTitle,
        professorName: updatedCourse.professor?.name || "Unknown Professor",
        enrollment: updatedCourse.enrollment,
        capacity: updatedCourse.capacity,
        requiredHours: updatedCourse.requiredHours,
        assignedStaff: updatedCourse.assignments.reduce(
          (sum, assignment) => sum + (assignment.staff?.hours || 0),
          0,
        ),
      },
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update course",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 },
      );
    }

    // Check if course exists
    const course = await prisma.section.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Delete the course (cascade will handle related records)
    await prisma.section.delete({
      where: { id: courseId },
    });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete course",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
