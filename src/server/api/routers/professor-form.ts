import { z } from "zod";
import { createTRPCRouter, professorProcedure } from "../trpc";

export const professorFormRoute = createTRPCRouter({
  /** Fetch all sections in a term for a professor */
  getProfessorSectionsForTerm: professorProcedure
    .input(
      z.object({
        professorId: z.string(),
        termId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sections = await ctx.db.section.findMany({
        where: {
          professorId: input.professorId,
          termId: input.termId,
        },
        include: {
          professorPreference: {
            include: {
              timesRequired: {
                select: {
                  id: true,
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
          qualifiedPreferences: {
            select: {
              staffPreference: {
                select: {
                  user: {
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
        },
      });
      return {
        sections: sections.map((s) => ({
          sectionId: s.id,
          courseCode: s.courseCode,
          courseSection: s.courseSection,
          courseTitle: s.courseTitle,
          meetingPattern: s.meetingPattern,
          enrollment: s.enrollment,
          capacity: s.capacity,
          requiredHours: s.requiredHours,
          availableAssistants: s.qualifiedPreferences?.flatMap(
            (qp) => qp.staffPreference?.user,
          ),
          professorPreference: {
            preferredStaff: s.professorPreference?.preferredStaff.map((ps) => ({
              ...ps.staff,
              roles: ps.staff.roles.map((r) => r.role),
            })),
            avoidedStaff: s.professorPreference?.avoidedStaff.map((as) => ({
              ...as.staff,
              roles: as.staff.roles.map((r) => r.role),
            })),
            timesRequired: s.professorPreference?.timesRequired ?? [],
            comments: s.professorPreference?.comments,
          },
        })),
      };
    }),
  /*Mutate professor preferences for a professors section*/
  updateProfessorSectionsForTerm: professorProcedure
    .input(
      z.object({
        professorId: z.string(),
        sections: z.array(
          z.object({
            sectionId: z.string(),
            professorPreference: z.object({
              preferredStaffId: z.array(z.string()),
              avoidedStaffId: z.array(z.string()),
              timesRequired: z.array(
                z.object({
                  hour: z.number(),
                  day: z.enum(["M", "T", "W", "R", "F"]),
                }),
              ),
              comments: z.string(),
            }),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { professorId, sections } = input;

      return await ctx.db.$transaction(async (tx) => {
        return Promise.all(
          sections.map(async (section) => {
            const { sectionId, professorPreference } = section;

            return tx.section.update({
              where: {
                id: sectionId,
                professorId: professorId,
              },
              data: {
                professorPreference: {
                  upsert: {
                    create: {
                      preferredStaff: {
                        create: professorPreference.preferredStaffId.map(
                          (id: string) => ({
                            staffId: id,
                          }),
                        ),
                      },
                      avoidedStaff: {
                        create: professorPreference.avoidedStaffId.map(
                          (id: string) => ({
                            staffId: id,
                          }),
                        ),
                      },
                      timesRequired: {
                        create: professorPreference.timesRequired.map(
                          (t: {
                            hour: number;
                            day: "M" | "T" | "W" | "R" | "F";
                          }) => ({
                            hour: t.hour,
                            day: t.day,
                          }),
                        ),
                      },
                      comments: professorPreference.comments,
                    },
                    update: {
                      preferredStaff: {
                        deleteMany: {},
                        create: professorPreference.preferredStaffId.map(
                          (id: string) => ({
                            staffId: id,
                          }),
                        ),
                      },
                      avoidedStaff: {
                        deleteMany: {},
                        create: professorPreference.avoidedStaffId.map(
                          (id: string) => ({
                            staffId: id,
                          }),
                        ),
                      },
                      timesRequired: {
                        deleteMany: {},
                        create: professorPreference.timesRequired.map(
                          (t: {
                            hour: number;
                            day: "M" | "T" | "W" | "R" | "F";
                          }) => ({
                            hour: t.hour,
                            day: t.day,
                          }),
                        ),
                      },
                      comments: professorPreference.comments,
                    },
                  },
                },
              },
            });
          }),
        );
      });
    }),
});
