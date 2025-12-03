import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";

export const courseRoute = createTRPCRouter({
  getAllCoursesForTerm: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ input: { termId }, ctx }) => {
      const courses = await ctx.db.section.findMany({
        where: { term: { id: termId } },
        include: {
          professorPreference: {
            include: {
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
                      timesAvailable: true,
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
});
