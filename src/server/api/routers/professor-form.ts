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
});
