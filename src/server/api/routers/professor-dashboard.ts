import { z } from "zod";
import { createTRPCRouter, professorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hasPermission } from "@/lib/permissions";

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
        !hasPermission(
          ctx.session.user,
          "professorPreferenceForm",
          "viewActiveTerm",
          { id: input.professorId },
        )
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
