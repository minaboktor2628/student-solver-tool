import { z } from "zod";
import { assistantProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hasPermission } from "@/lib/permissions";
import { isUserAllowedInActiveTerm } from "@/lib/permission-helpers";

const baseInput = z.object({
  userId: z.string().min(1),
  termId: z.string().min(1),
});
export const studentDashboardRoute = createTRPCRouter({
  getPreferencesFormData: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      const staffPref = await ctx.db.staffPreference.findUnique({
        where: { userId_termId: { userId, termId } },
        include: {
          timesAvailable: true,
          qualifiedForSections: {
            include: {
              section: true,
            },
          },
          preferredSections: {
            include: {
              section: true,
            },
          },
        },
      });

      if (!staffPref) {
        return null;
      }

      return {
        isAvailableForTerm: staffPref.isAvailableForTerm,
        timesAvailable: staffPref.timesAvailable.map((t) => ({
          day: t.day,
          hour: t.hour,
        })),
        qualifications: staffPref.qualifiedForSections.map((q) => ({
          sectionId: q.sectionId,
          courseCode: q.section.courseCode,
          courseSection: q.section.courseSection,
          courseTitle: q.section.courseTitle,
        })),
        preferences: staffPref.preferredSections.map((p) => ({
          sectionId: p.sectionId,
          courseCode: p.section.courseCode,
          courseSection: p.section.courseSection,
          courseTitle: p.section.courseTitle,
          rank: p.rank,
        })),
        comments: staffPref.comments,
      };
    }),

  hasSubmittedPreferencesForm: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      const formInput = await ctx.db.staffPreference.findUnique({
        where: {
          userId_termId: { userId, termId },
        },
      });
      if (formInput) return true;
      return false;
    }),

  getTermInfo: assistantProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ input: { termId }, ctx }) => {
      const term = await ctx.db.term.findUnique({
        where: {
          id: termId,
        },
      });
      return {
        term: {
          termLetter: term?.termLetter,
          year: term?.year,
          staffDueDate: term?.termStaffDueDate,
          isPublished: term?.published,
        },
      };
    }),

  getStudentDashboardInfo: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      if (
        !hasPermission(
          ctx.session.user,
          "staffPreferenceForm",
          "viewActiveTerm",
          {
            userId,
            isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
              ctx.session.user.id,
            ),
          },
        )
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot access qualifications for other users.`,
        });
      }

      const staff = await ctx.db.user.findUnique({
        where: {
          id: userId,
        },
      });
      const term = await ctx.db.term.findUnique({
        where: {
          id: termId,
        },
      });
      return {
        info: {
          name: staff?.name,
          email: staff?.email,
          term: {
            termLetter: term?.termLetter,
            termYear: term?.year,
            dueDate: term?.termStaffDueDate,
          },
        },
      };
    }),

  getPastAssignments: assistantProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input: { userId }, ctx }) => {
      if (
        !hasPermission(ctx.session.user, "staffPreferenceForm", "viewHistory", {
          userId,
          isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
            ctx.session.user.id,
          ),
        })
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot access qualifications for other users.`,
        });
      }

      const rows = await ctx.db.sectionAssignment.findMany({
        where: {
          staffId: userId,
          section: {
            term: {
              published: true,
            },
          },
        },
        include: {
          section: {
            include: {
              professor: {
                select: {
                  email: true,
                  name: true,
                },
              },
              term: {
                select: {
                  termLetter: true,
                  year: true,
                },
              },
            },
          },
        },
      });

      return { assignments: rows };
    }),

  getCurrentAssignment: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      if (
        !hasPermission(
          ctx.session.user,
          "staffPreferenceForm",
          "viewActiveTerm",
          {
            userId,
            isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
              ctx.session.user.id,
            ),
          },
        )
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot access qualifications for other users.`,
        });
      }

      const activeTerm = await ctx.db.term.findUnique({
        where: { id: termId },
      });

      if (!activeTerm?.published) {
        return null;
      }

      const row = await ctx.db.sectionAssignment.findFirst({
        where: {
          staffId: userId,
          section: { termId: termId },
        },
        include: {
          section: {
            include: {
              professor: true,
            },
          },
        },
      });

      return { assignment: row };
    }),
});

export default studentDashboardRoute;
