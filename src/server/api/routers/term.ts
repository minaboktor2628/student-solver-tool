/* Term related endpoints */
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  coordinatorProcedure,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { calculateRequiredHours } from "@/lib/utils";

export const termRoute = createTRPCRouter({
  getTerms: publicProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.term.findMany({
      orderBy: [{ year: "desc" }, { termLetter: "desc" }],
      select: { active: true, year: true, termLetter: true, id: true },
    });

    // combine year and term letter into label field for convenience
    const withLabel = all.map((t) => ({
      ...t,
      label: `${t.year} ${t.termLetter}`,
    }));

    // assuming only one active term at a time
    const active = withLabel.find((t) => t.active) ?? null;

    return { active, all: withLabel };
  }),

  getActive: publicProcedure.query(async ({ ctx }) => {
    // find first because only supposed to have one active term
    return ctx.db.term.findFirst({
      where: { active: true },
      select: { active: true, year: true, termLetter: true, id: true },
    });
  }),

  getAllTerms: coordinatorProcedure.query(async ({ ctx }) => {
    const terms = await ctx.db.term.findMany({
      include: {
        sections: true,
        allowedEmails: true,
      },
      orderBy: [{ year: "desc" }, { termLetter: "desc" }],
    });

    return {
      terms: terms.map((term) => ({
        id: term.id,
        name: `${term.termLetter} ${term.year}`,
        termLetter: term.termLetter,
        year: term.year,
        staffDueDate: term.termStaffDueDate.toISOString(),
        professorDueDate: term.termProfessorDueDate.toISOString(),
        courseCount: term.sections.length,
        peopleCount: term.allowedEmails.length,
        active: term.active,
      })),
    };
  }),

  createTerm: coordinatorProcedure
    .input(
      z.object({
        termLetter: z.enum(["A", "B", "C", "D"]),
        year: z.number(),
        staffDueDate: z.string(),
        professorDueDate: z.string(),
        csvData: z
          .array(
            z.object({
              email: z.string(),
              role: z.enum(["PLA", "GLA", "TA", "COORDINATOR", "PROFESSOR"]),
            }),
          )
          .optional(),
        courses: z.array(z.any()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        termLetter,
        year,
        staffDueDate,
        professorDueDate,
        csvData,
        courses,
      } = input;

      // Validate required fields
      if (!termLetter || !year || !staffDueDate || !professorDueDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required fields",
        });
      }

      // Create term
      const term = await ctx.db.term.create({
        data: {
          termLetter,
          year: parseInt(year.toString()),
          termStaffDueDate: new Date(staffDueDate),
          termProfessorDueDate: new Date(professorDueDate),
        },
      });

      // Create allowed emails
      if (csvData && Array.isArray(csvData)) {
        for (const row of csvData) {
          try {
            await ctx.db.allowedEmail.create({
              data: {
                email: row.email,
                role: row.role,
                termId: term.id,
              },
            });
          } catch (emailError) {
            // Continue on individual email creation errors
          }
        }
      }

      // Create sections
      if (courses && Array.isArray(courses) && courses.length > 0) {
        for (const course of courses) {
          try {
            // Find or create the professor user
            let professorUser = await ctx.db.user.findFirst({
              where: {
                name: { contains: course.professorName },
              },
            });

            if (!professorUser) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: `Professor "${course.professorName}" not found in the system. Please add them as a user first before creating courses for them.`,
              });
            }

            // Calculate required hours based on enrollment
            const calculatedHours = calculateRequiredHours(
              course.enrollment ?? 0,
            );

            // Create the section
            await ctx.db.section.create({
              data: {
                termId: term.id,
                courseTitle: course.courseTitle,
                courseCode: course.courseCode,
                description:
                  course.description ||
                  `${course.courseCode} - ${course.courseTitle}`,
                professorId: professorUser.id,
                enrollment: course.enrollment ?? 0,
                capacity: course.capacity ?? 0,
                requiredHours: calculatedHours,
                academicLevel: "UNDERGRADUATE",
                courseSection: course.courseSection ?? "01",
                meetingPattern: course.meetingPattern ?? "TBD",
              },
            });
          } catch (courseError) {
            // Continue on individual course creation errors
          }
        }
      }

      return {
        success: true,
        termId: term.id,
        message: "Term created successfully",
      };
    }),

  deleteTerm: coordinatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      await ctx.db.term.delete({
        where: { id },
      });

      return {
        success: true,
        message: "Term deleted successfully",
      };
    }),

  publishTerm: coordinatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      // Set all terms to inactive first
      await ctx.db.term.updateMany({
        where: { active: true },
        data: { active: false },
      });

      // Set the selected term to active
      const updatedTerm = await ctx.db.term.update({
        where: { id },
        data: { active: true },
      });

      return {
        success: true,
        termId: updatedTerm.id,
        message: "Term published successfully",
      };
    }),

  updateTerm: coordinatorProcedure
    .input(z.object({ id: z.string(), data: z.any() }))
    .mutation(async ({ input: { id, data }, ctx }) => {
      const updated = await ctx.db.term.update({
        where: { id },
        data,
      });

      return {
        success: true,
        term: updated,
      };
    }),
});
