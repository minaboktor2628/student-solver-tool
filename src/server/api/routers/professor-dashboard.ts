import { z } from "zod";
import { createTRPCRouter, professorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const professorDashboardRoute = createTRPCRouter({
  getDashBoardInfo: professorProcedure
    .input(
      z.object({
        professorId: z.string(),
        termId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        ctx.session.user.id !== input.professorId &&
        !ctx.session.user.roles.includes("COORDINATOR")
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
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
