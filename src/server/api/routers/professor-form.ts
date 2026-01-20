import { z } from "zod";
import { createTRPCRouter, professorProcedure, publicProcedure } from "../trpc";

export const professorFormRoute = createTRPCRouter({
  /** Fetch all sections in a term for a professor */
  getProfessorSectionsForTerm: professorProcedure.query(async ({ ctx }) => {
    const sections = await ctx.db.section.findMany({
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

  /*Fetch all available/qualified assistants for a section - might need to add qualified assistants to section schema*/
  getAvailableAssistants: professorProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      where: {
        roles: {
          some: {
            role: { in: ["PLA", "TA"] },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: { select: { role: true } },
      },
    });
  }),
});
export default professorFormRoute;
