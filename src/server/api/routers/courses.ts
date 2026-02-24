import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { calculateRequiredAssistantHours } from "@/lib/utils";
import { TermLetter, AcademicLevel } from "@prisma/client";
import { SectionItemSchema } from "@/lib/courselisting-api";
import { unknownProfessorName } from "@/lib/constants";

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
            id: c.professor?.id,
            email: c.professor?.email,
            name: c.professor?.name,
            comments: c.professorPreference?.comments,
            timesRequired: c.professorPreference?.timesRequired ?? [],
            preferredStaff: c.professorPreference?.preferredStaff.map((s) => ({
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
              name: s.staff.name ?? "",
              email: s.staff.email ?? "",
              hours: s.staff.hours ?? 0,
              roles: s.staff.roles.map((r) => r.role),
              assignedSection: {
                id: c.id,
                code: c.courseCode + "-" + c.courseSection,
              } as { id: string; code: string } | undefined,
              timesAvailable: sp?.timesAvailable ?? [],
              comments: sp?.comments ?? null,
              preferredSections: sp?.preferredSections ?? [],
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

  getAllCourses: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sections = await ctx.db.section.findMany({
        where: { termId: input.termId },
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
          termId: course.termId,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          courseSection: course.courseSection,
          meetingPattern: course.meetingPattern,
          description: course.description,
          professorName: course.professor?.name ?? unknownProfessorName,
          professorId: course.professorId,
          professorEmail: course.professor?.email ?? "",
          enrollment: course.enrollment,
          capacity: course.capacity,
          requiredHours: course.requiredHours,
          assignedStaff: course.assignments.reduce(
            (sum, assignment) => sum + (assignment.staff?.hours ?? 0),
            0,
          ),
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
          professorName: course.professor?.name ?? unknownProfessorName,
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
        courses: z.array(
          z.object({
            courseCode: z.string(),
            courseTitle: z.string(),
            professorName: z.string().optional(),
            enrollment: z.number().default(0),
            capacity: z.number().default(0),
            requiredHours: z.number().optional(),
            academicLevel: z
              .nativeEnum(AcademicLevel)
              .default(AcademicLevel.UNDERGRADUATE),
            courseSection: z.string().default("01"),
            meetingPattern: z.string().default("TBD"),
            description: z.string().default(""),
            term: z.string().optional(),
          }),
        ),
        termId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { courses, termId } = input;

      if (courses.length === 0) {
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
          enrollment,
          capacity,
          requiredHours,
          academicLevel,
          courseSection,
          meetingPattern,
          description,
          term: selectedTerm,
        } = courseData;

        // Determine which term to use
        let finalTermId: string | undefined = termId;
        if (!finalTermId && selectedTerm) {
          const termParts = selectedTerm.split(" ");
          const termLetter = termParts[0];
          const termYear = termParts[1] ?? "";

          if (
            !termLetter ||
            !Object.values(TermLetter).includes(termLetter as TermLetter)
          ) {
            continue;
          }

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

        // Find professor if name provided
        let professorId: string | undefined;
        if (professorName) {
          const professor = await ctx.db.user.findFirst({
            where: {
              name: {
                contains: professorName,
              },
            },
          });
          professorId = professor?.id;
        }

        const calculatedHours = calculateRequiredAssistantHours(enrollment);
        const finalRequiredHours = requiredHours ?? calculatedHours;

        const createdCourse = await ctx.db.section.create({
          data: {
            termId: finalTermId,
            courseCode,
            courseTitle,
            description,
            professorId,
            enrollment,
            capacity,
            requiredHours: finalRequiredHours,
            academicLevel,
            courseSection,
            meetingPattern,
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
        data: SectionItemSchema,
      }),
    )
    .mutation(async ({ input: { id, data }, ctx }) => {
      const updated = await ctx.db.section.update({
        where: { id },
        data: {
          professorId: data.professorId,
          academicLevel: data.academicLevel,
          capacity: data.capacity,
          courseCode: data.courseCode,
          courseTitle: data.courseTitle,
          meetingPattern: data.meetingPattern,
          courseSection: data.courseSection,
          enrollment: data.enrollment,
          requiredHours: data.requiredHours,
          description: data.description,
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
});
