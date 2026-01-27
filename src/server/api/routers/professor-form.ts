import { z } from "zod";
import { createTRPCRouter, professorProcedure, publicProcedure } from "../trpc";

export const professorFormRoute = createTRPCRouter({
  /** Fetch all sections in a term for a professor */
  getProfessorSectionsForTerm: professorProcedure
    .input(
      z.object({
        professorId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sections = await ctx.db.section.findMany({
        where: {
          professorId: input.professorId,
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
        sectionId: z.string(),
        professorId: z.string(),
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
    )
    .mutation(
      async ({
        input: { sectionId, professorId, professorPreference },
        ctx,
      }) => {
        const prefStaffList = await ctx.db.user.findMany({
          where: {
            id: {
              in: professorPreference.preferredStaffId,
            },
          },
        });
        const antiprefStaffList = await ctx.db.user.findMany({
          where: {
            id: {
              in: professorPreference.avoidedStaffId,
            },
          },
        });
        const profPref = await ctx.db.section.update({
          where: {
            id: sectionId,
            professorId: professorId,
          },
          data: {
            professorPreference: {
              upsert: {
                create: {
                  preferredStaff: {
                    create: prefStaffList.map((u) => ({
                      staffId: u.id,
                    })),
                  },
                  avoidedStaff: {
                    create: antiprefStaffList.map((u) => ({
                      staffId: u.id,
                    })),
                  },
                  timesRequired: {
                    create: professorPreference.timesRequired.map((t) => ({
                      hour: t.hour,
                      day: t.day,
                    })),
                  },
                  comments: professorPreference.comments,
                },
                update: {
                  preferredStaff: {
                    deleteMany: {},
                    create: prefStaffList.map((u) => ({
                      staffId: u.id,
                    })),
                  },
                  avoidedStaff: {
                    deleteMany: {},
                    create: antiprefStaffList.map((u) => ({
                      staffId: u.id,
                    })),
                  },
                  timesRequired: {
                    deleteMany: {},
                    create: professorPreference.timesRequired.map((t) => ({
                      hour: t.hour,
                      day: t.day,
                    })),
                  },
                  comments: professorPreference.comments,
                },
              },
            },
          },
        });
      },
    ),
});
