import { z } from "zod";
import { assistantProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hasPermission } from "@/lib/permissions";
import { TermProvider } from "@/components/term-combobox";

const baseInput = z.object({
  userId: z.string().min(1),
  termId: z.string().min(1),
});
export const studentDashboardRoute = createTRPCRouter({
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
        },
      };
    }),

  getStudentDashboardInfo: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      //TODO auth check

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
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      //TODO add auth check

      const rows = await ctx.db.sectionAssignment.findMany({
        where: {
          staffId: userId,
          section: {
            // TODO: if active term ever out of order for some reason, results could be weird
            termId: { not: termId },
          },
        },
        include: {
          section: true,
        },
      });

      return { assignments: rows };
    }),

  getCurrentAssignment: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      //TODO add auth check

      const row = await ctx.db.sectionAssignment.findFirst({
        where: {
          staffId: userId,
          section: { termId: termId },
        },
        include: {
          section: true,
        },
      });

      return { assignment: row };
    }),
});

export default studentDashboardRoute;
