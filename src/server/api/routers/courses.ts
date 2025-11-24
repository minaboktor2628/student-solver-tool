import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";

export const courseRoute = createTRPCRouter({
  getAllCoursesForTerm: coordinatorProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ input: { termId }, ctx }) => {
      const courses = await ctx.db.section.findMany({
        where: { term: { id: termId } },
        include: {
          assignments: {
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
          professor: { select: { name: true } },
        },
      });

      return {
        courses: courses.map((c) => ({
          id: c.id,
          enrollment: c.enrollment,
          capacity: c.capacity,
          requiredHours: c.requiredHours,
          description: c.description,
          title: c.courseTitle,
          courseCode: c.courseCode,
          professor: c.professor.name,
          staff: c.assignments.map((s) => ({
            ...s.staff,
            roles: s.staff.roles.map((r) => r.role),
          })),
        })),
      };
    }),
});
