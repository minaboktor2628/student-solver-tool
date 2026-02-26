import { z } from "zod";
import { createTRPCRouter, professorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hasPermission } from "@/lib/permissions";
import { isUserAllowedInActiveTerm } from "@/lib/permission-helpers";

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

      const [professor, term, hasSubmittedPreferences] = await Promise.all([
        ctx.db.user.findUnique({
          where: { id: input.professorId },
        }),
        ctx.db.term.findUnique({
          where: { id: input.termId },
        }),
        ctx.db.section
          .findFirst({
            where: {
              termId: input.termId,
              professorId: input.professorId,
              professorPreference: {
                isNot: null,
              },
            },
            select: { id: true },
          })
          .then((section) => !!section),
      ]);

      return {
        info: {
          professor: {
            name: professor?.name,
            hasSubmitted: hasSubmittedPreferences,
          },
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

  getPastProfessorAssignments: professorProcedure
    .input(
      z.object({
        professorId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        !hasPermission(
          ctx.session.user,
          "professorPreferenceForm",
          "viewHistory",
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
          term: {
            published: true,
          },
        },
        include: {
          term: {
            select: {
              id: true,
              termLetter: true,
              year: true,
            },
          },
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
        sections: sections.map((section) => ({
          termId: section.term.id,
          termLetter: section.term.termLetter,
          year: section.term.year,
          sectionId: section.id,
          courseCode: section.courseCode,
          courseSection: section.courseSection,
          courseTitle: section.courseTitle,
          meetingPattern: section.meetingPattern,
          assignedStaff: section.assignments.map((assignment) => ({
            id: assignment.staff.id,
            name: assignment.staff.name,
            email: assignment.staff.email,
            roles: assignment.staff.roles.map((role) => role.role),
          })),
        })),
      };
    }),
});
