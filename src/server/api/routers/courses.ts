import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { syncCourses as syncCoursesUtil } from "@/lib/sync-courses";
import { calculateRequiredAssistantHours } from "@/lib/utils";
import { TermLetter, AcademicLevel } from "@prisma/client";

export const courseRoute = createTRPCRouter({
  getAllCoursesForTerm: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ input: { termId }, ctx }) => {
      const courses = await ctx.db.section.findMany({
        where: { term: { id: termId } },
        include: {
          professorPreference: {
            include: {
              timesRequired: {
                select: {
                  day: true,
                  hour: true,
                },
              },
              avoidedStaff: {
                include: {
                  staff: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      hours: true,
                      roles: { select: { role: true } },
                    },
                  },
                },
              },
              preferredStaff: {
                include: {
                  staff: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      hours: true,
                      roles: { select: { role: true } },
                    },
                  },
                },
              },
            },
          },
          assignments: {
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  hours: true,
                  roles: { select: { role: true } },
                  // Pull the single preference row for this term (unique per user/term)
                  staffPreferences: {
                    where: { termId },
                    select: {
                      comments: true,
                      timesAvailable: {
                        select: {
                          day: true,
                          hour: true,
                        },
                      },
                      qualifiedForSections: {
                        select: { sectionId: true },
                      },

                      preferredSections: {
                        select: {
                          rank: true,
                          section: {
                            select: {
                              id: true,
                              courseTitle: true,
                              courseCode: true,
                              courseSection: true,
                            },
                          },
                        },
                      },
                    },
                    take: 1,
                  },
                },
              },
            },
          },
          professor: { select: { id: true, name: true, email: true } },
        },
      });

      return {
        courses: courses.map((c) => ({
          id: c.id,
          enrollment: c.enrollment,
          capacity: c.capacity,
          requiredHours: c.requiredHours,
          description: c.description,
          title: c.courseTitle,
          courseCode: c.courseCode,
          courseSection: c.courseSection,
          meetingPattern: c.meetingPattern,
          academicLevel: c.academicLevel,
          professor: {
            id: c.professor.id,
            email: c.professor.email,
            name: c.professor.name,
            comments: c.professorPreference?.comments,
            timesRequired: c.professorPreference?.timesRequired ?? [],
            preferedStaff: c.professorPreference?.preferredStaff.map((s) => ({
              ...s.staff,
              roles: s.staff.roles.map((r) => r.role),
            })),
            avoidedStaff: c.professorPreference?.avoidedStaff.map((s) => ({
              ...s.staff,
              roles: s.staff.roles.map((r) => r.role),
            })),
          },

          staff: c.assignments.map((s) => {
            const sp = s.staff.staffPreferences[0]; // the single preference row for this term (or undefined)

            const qualifiedForThisSection =
              sp?.qualifiedForSections.some((q) => q.sectionId === c.id) ??
              false;

            const avoidedByProfessor = Boolean(
              c.professorPreference?.avoidedStaff.some(
                (a) => a.staff.id === s.staff.id,
              ),
            );

            return {
              id: s.staff.id,
              name: s.staff.name,
              email: s.staff.email,
              hours: s.staff.hours,
              roles: s.staff.roles.map((r) => r.role),
              assignedSection: {
                id: c.id,
                code: c.courseCode + "-" + c.courseSection,
              } as { id: string; code: string } | undefined,
              timesAvailable: sp?.timesAvailable ?? [],
              comments: sp?.comments ?? null,
              preferedSections: sp?.preferredSections ?? [],
              locked: s.locked,
              flags: {
                qualifiedForThisSection,
                notAvoidedByProfessor: !avoidedByProfessor,
                // they are assigned to *this* section, so not "available"
                availableThisTerm: false,
              },
            };
          }),
        })),
      };
    }),

  getAllCourses: coordinatorProcedure.query(async ({ ctx }) => {
    const sections = await ctx.db.section.findMany({
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

    return {
      success: true,
      courses: sections.map((course) => ({
        id: course.id,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        professorName: course.professor?.name ?? "Unknown Professor",
        professorEmail: course.professor?.email ?? "",
        enrollment: course.enrollment,
        capacity: course.capacity,
        requiredHours: course.requiredHours,
        assignedStaff: course.assignments.reduce(
          (sum, assignment) => sum + (assignment.staff?.hours ?? 0),
          0,
        ),
        term: course.term
          ? `${course.term.termLetter} ${course.term.year}`
          : "Unknown Term",
        academicLevel: course.academicLevel,
      })),
    };
  }),

  getCourse: coordinatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id }, ctx }) => {
      const course = await ctx.db.section.findUnique({
        where: { id },
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      return {
        success: true,
        course: {
          id: course.id,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          professorName: course.professor?.name ?? "Unknown Professor",
          professorId: course.professorId,
          enrollment: course.enrollment,
          capacity: course.capacity,
          requiredHours: course.requiredHours,
          description: course.description,
          academicLevel: course.academicLevel,
          courseSection: course.courseSection,
          meetingPattern: course.meetingPattern,
          term: course.term
            ? `${course.term.termLetter} ${course.term.year}`
            : "Unknown Term",
          assignedStaff: course.assignments,
        },
      };
    }),

  createCourses: coordinatorProcedure
    .input(
      z.object({
        courses: z.array(z.any()),
        termId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { courses, termId } = input;

      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No courses provided",
        });
      }

      const createdCourses = [];

      for (const courseData of courses) {
        const {
          courseCode,
          courseTitle,
          professorName,
          enrollment = 0,
          capacity = 0,
          academicLevel = "UNDERGRADUATE",
          courseSection = "01",
          meetingPattern = "TBD",
          description = "",
          term: selectedTerm,
        } = courseData as {
          courseCode?: string;
          courseTitle?: string;
          professorName?: string;
          enrollment?: number;
          capacity?: number;
          academicLevel?: string;
          courseSection?: string;
          meetingPattern?: string;
          description?: string;
          term?: string;
        };

        if (!courseCode || !courseTitle || !professorName) {
          continue;
        }

        // Determine which term to use
        let finalTermId = termId;
        if (!finalTermId && selectedTerm) {
          const termParts = (selectedTerm as string).split(" ");
          const termLetter = termParts[0] ?? "";
          const termYear = termParts[1] ?? "";
          const termData = await ctx.db.term.findFirst({
            where: {
              termLetter: termLetter as TermLetter,
              year: parseInt(termYear),
            },
          });
          finalTermId = termData?.id;
        }

        if (!finalTermId) {
          continue;
        }

        // Find or create professor
        const professor = await ctx.db.user.findFirst({
          where: {
            name: {
              contains: professorName,
            },
          },
        });

        if (!professor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Professor "${professorName}" not found in the system. Please add them as a user first before creating courses for them.`,
          });
        }

        const calculatedHours = calculateRequiredAssistantHours(
          typeof enrollment === "number" ? enrollment : 0,
        );

        const createdCourse = await ctx.db.section.create({
          data: {
            termId: finalTermId,
            courseCode: courseCode ?? "",
            courseTitle: courseTitle ?? "",
            description: description ?? "",
            professorId: professor.id,
            enrollment: typeof enrollment === "number" ? enrollment : 0,
            capacity: typeof capacity === "number" ? capacity : 0,
            requiredHours: calculatedHours,
            academicLevel:
              (academicLevel as AcademicLevel) ?? AcademicLevel.UNDERGRADUATE,
            courseSection: courseSection ?? "01",
            meetingPattern: meetingPattern ?? "TBD",
          },
        });

        createdCourses.push(createdCourse);
      }

      return {
        success: true,
        message: `Created ${createdCourses.length} courses`,
        courseCount: createdCourses.length,
      };
    }),

  updateCourse: coordinatorProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          courseCode: z.string().optional(),
          courseTitle: z.string().optional(),
          description: z.string().optional(),
          enrollment: z.number().optional(),
          capacity: z.number().optional(),
          courseSection: z.string().optional(),
          meetingPattern: z.string().optional(),
          academicLevel: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input: { id, data }, ctx }) => {
      const updated = await ctx.db.section.update({
        where: { id },
        data: {
          ...data,
          academicLevel:
            (data.academicLevel as "UNDERGRADUATE" | "GRADUATE" | undefined) ??
            undefined,
        },
      });

      return {
        success: true,
        course: updated,
      };
    }),

  deleteCourse: coordinatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      await ctx.db.section.delete({
        where: { id },
      });

      return {
        success: true,
        message: "Course deleted successfully",
      };
    }),

  syncCourses: coordinatorProcedure.mutation(async () => {
    const result = await syncCoursesUtil();
    return {
      success: true,
      message: "Course sync completed",
      ...result,
    };
  }),
});
