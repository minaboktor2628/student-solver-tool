import { z } from "zod";
import { createTRPCRouter, professorProcedure } from "../trpc";

export const professorDashboardRoute = createTRPCRouter({
  getDashBoardInfo: professorProcedure
    .input(
      z.object({
        professorId: z.string(),
        termId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const professor = await ctx.db.user.findUnique({
        where: {
          id: input.professorId,
        },
      });
      const term = await ctx.db.term.findUnique({
        where: {
          id: input.termId,
        },
      });
      return {
        info: {
          professor: professor?.name,
          term: {
            termLetter: term?.termLetter,
            termYear: term?.year,
            termProfDueDate: term?.termProfessorDueDate,
          },
        },
      };
    }),
});
