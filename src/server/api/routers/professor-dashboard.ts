import { z } from "zod";
import { createTRPCRouter, professorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hasPermission, isUserAllowedInActiveTerm } from "@/lib/permissions";

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
          {
            userId: input.professorId,
            isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
              ctx.session.user.id,
            ),
          },
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
            isPublished: term?.published,
          },
        },
      };
    }),

  getProfessorAssignments: professorProcedure
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
          {
            userId: input.professorId,
            isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
              ctx.session.user.id,
            ),
          },
        )
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const sections = await ctx.db.section.findMany({
        where: {
          professorId: input.professorId,
          termId: input.termId,
        },
        include: {
          assignments: {
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  roles: { select: { role: true } },
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
          assignedStaff: s.assignments.map((a) => ({
            id: a.staff.id,
            name: a.staff.name,
            email: a.staff.email,
            roles: a.staff.roles.map((r) => r.role),
          })),
        })),
      };
    }),
});
