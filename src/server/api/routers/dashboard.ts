import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";

export const dashboardRoute = createTRPCRouter({
  getDashboardData: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ input: { termId }, ctx }) => {
      const term = await ctx.db.term.findUnique({
        where: { id: termId },
      });

      if (!term) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Term not found",
        });
      }

      // Fetch courses for the term
      const sections = await ctx.db.section.findMany({
        where: { termId },
        include: {
          professor: true,
          assignments: {
            include: {
              staff: {
                include: {
                  roles: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
            },
          },
        },
        orderBy: {
          courseCode: "asc",
        },
      });

      // Fetch all staff with their preferences for this term
      const staffUsers = await ctx.db.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                in: ["PLA", "TA"],
              },
            },
          },
        },
        include: {
          roles: true,
          staffPreferences: {
            where: {
              termId,
            },
          },
        },
      });

      // Fetch all professors
      const professorUsers = await ctx.db.user.findMany({
        where: {
          roles: {
            some: {
              role: "PROFESSOR",
            },
          },
        },
        include: {
          teaches: {
            where: {
              termId,
            },
            include: {
              professorPreference: true,
            },
          },
        },
      });

      // Transform courses with correct hour calculations
      const courses = sections.map((section) => {
        // Calculate assigned hours based on staff roles
        // PLA = 10 hours, TA = 20 hours
        const assignedHours = section.assignments.reduce((sum, assignment) => {
          const staffRole = assignment.staff.roles.find(
            (r) => r.role === "PLA" || r.role === "TA",
          )?.role;

          if (staffRole === "TA") {
            return sum + 20;
          } else if (staffRole === "PLA") {
            return sum + 10;
          }
          return sum;
        }, 0);

        return {
          id: section.id,
          courseCode: section.courseCode,
          courseTitle: section.courseTitle,
          professorName: section.professor?.name ?? "Unknown",
          enrollment: section.enrollment,
          capacity: section.capacity,
          requiredHours: section.requiredHours,
          assignedHours,
          assignmentCount: section._count.assignments,
        };
      });

      // Get unique professors in this term
      const uniqueProfessors = [
        ...new Map(
          professorUsers
            .filter((p) => p.teaches.length > 0)
            .map((p) => [
              p.id,
              {
                id: p.id,
                name: p.name,
                email: p.email,
                courseCount: p.teaches.length,
              },
            ]),
        ).values(),
      ];

      return {
        currentTerm: `${term.termLetter} ${term.year}`,
        courses,
        staff: staffUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles.map((r) => r.role),
          hasPreferences: user.staffPreferences.length > 0,
        })),
        professors: uniqueProfessors,
        termId,
      };
    }),
});
