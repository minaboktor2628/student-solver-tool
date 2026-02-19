import { z } from "zod";
import { createTRPCRouter, professorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hasPermission } from "@/lib/permissions";

export const professorFormRoute = createTRPCRouter({
  getCanEdit: professorProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input: { userId }, ctx }) => {
      const canEdit = await ctx.db.user.findUnique({
        where: { id: userId },
        select: {
          canEditForm: true,
        },
      });
      return { canEdit };
    }),
  /** Fetch all sections in a term for a professor */
  getProfessorSectionsForTerm: professorProcedure
    .input(
      z.object({
        professorId: z.string(),
        termId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        !hasPermission(
          ctx.session.user,
          "professorPreferenceForm",
          "viewActiveTerm",
          { id: input.professorId },
        )
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const availableStaffInThisTerm = await ctx.db.user.findMany({
        where: {
          AllowedInTerms: { some: { id: input.termId } },
          roles: { some: { role: { in: ["TA", "PLA"] } } },
          OR: [
            // no preference row for this term yet => include
            { staffPreferences: { none: { termId: input.termId } } },

            // preference exists and they said they're available => include
            {
              staffPreferences: {
                some: { termId: input.termId, isAvailableForTerm: true },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          hours: true,
          roles: { select: { role: true } },
        },
      });

      const availableStaff = availableStaffInThisTerm.map((u) => ({
        ...u,
        roles: u.roles.map((r) => r.role),
      }));

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
        },
      });

      return {
        availableAssistants: availableStaff,
        sections: sections.map((s) => ({
          sectionId: s.id,
          courseCode: s.courseCode,
          courseSection: s.courseSection,
          courseTitle: s.courseTitle,
          meetingPattern: s.meetingPattern,
          enrollment: s.enrollment,
          capacity: s.capacity,
          requiredHours: s.requiredHours,
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
      if (
        !hasPermission(ctx.session.user, "professorPreferenceForm", "update", {
          id: input.professorId,
        })
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { professorId, sections } = input;

      return await ctx.db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: professorId },
          select: { canEditForm: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `User with ID ${professorId} not found.`,
          });
        }

        if (!user.canEditForm) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No permission to edit form.",
          });
        }
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
