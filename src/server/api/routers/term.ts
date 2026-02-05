/* Term related endpoints */
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  coordinatorProcedure,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { Role, TermLetter } from "@prisma/client";
import { createTermInputSchema } from "@/types/form-inputs";
import { getDefaultHoursForRole } from "@/lib/constants";
import { getTermSectionData, SectionItemSchema } from "@/lib/courselisting-api";

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
        allowedUsers: true,
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
        peopleCount: term.allowedUsers.length,
        active: term.active,
      })),
    };
  }),

  getTermStats: coordinatorProcedure.query(async ({ ctx }) => {
    return ctx.db.term.findMany({
      select: {
        id: true,
        active: true,
        termLetter: true,
        year: true,
        termStaffDueDate: true,
        termProfessorDueDate: true,
        _count: { select: { sections: true, allowedUsers: true } },
      },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    });
  }),

  deleteTerm: coordinatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const term = await ctx.db.term.findUnique({ where: { id } });

      if (term?.active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete an active term.",
        });
      }

      return ctx.db.term.delete({ where: { id } });
    }),

  createTerm: coordinatorProcedure
    .input(createTermInputSchema)
    .mutation(
      async ({
        ctx,
        input: { termStaffDueDate, termProfessorDueDate, termLetter, year },
      }) => {
        const term = await ctx.db.term.findUnique({
          where: { termLetter_year: { termLetter, year } },
        });

        if (term) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A term with this letter and year already exists.",
          });
        }

        return ctx.db.term.create({
          data: {
            year,
            termLetter,
            termProfessorDueDate,
            termStaffDueDate,
          },
        });
      },
    ),

  activateTerm: coordinatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      // Set all terms to inactive first
      await ctx.db.term.updateMany({
        where: { active: true },
        data: { active: false },
      });

      // Set the selected term to active
      return ctx.db.term.update({
        where: { id },
        data: { active: true },
      });
    }),

  deactivateTerm: coordinatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      return ctx.db.term.update({
        where: { id },
        data: { active: false },
      });
    }),

  syncUsersToTerm: coordinatorProcedure
    .input(
      z.object({
        users: z.array(
          z.object({
            name: z.string(),
            email: z.string().email(),
            role: z.nativeEnum(Role),
          }),
        ),
        termId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { users, termId } }) => {
      const term = await ctx.db.term.update({
        where: { id: termId },
        data: {
          allowedUsers: {
            // if the user does not already exist, make a new user
            connectOrCreate: users.map(({ name, email, role }) => ({
              where: { email },
              create: {
                name,
                email,
                hours: getDefaultHoursForRole(role),
                roles: { create: { role } },
              },
            })),
          },
        },
        include: { allowedUsers: true },
      });

      // term.allowedUsers may contain more users than just the ones we touched
      // we return *only* the set we just created/connected:
      const affectedUsers = term.allowedUsers.filter((u) =>
        users.some((inputUser) => inputUser.email === u.email),
      );

      return affectedUsers.length;
    }),

  getCourseListingData: coordinatorProcedure
    .input(
      z.object({
        year: z.number().int().nonnegative(),
        termLetter: z.nativeEnum(TermLetter),
      }),
    )
    .query(async ({ ctx, input: { year, termLetter } }) => {
      const term = await ctx.db.term.findUnique({
        where: { termLetter_year: { termLetter, year } },
        include: { allowedUsers: true },
      });

      if (!term) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Term ${termLetter} ${year} not found`,
        });
      }

      const sections = await getTermSectionData(year, termLetter);

      const allowedProfessorByName = new Map(
        term.allowedUsers.map((au) => [au.name, au.id]),
      );

      const sectionsWithAllowedFlag = sections.map((section) => {
        const professorId =
          allowedProfessorByName.get(section.professorName) ?? null;

        return {
          ...section,
          professorId,
          professorIsAllowedOnTerm: professorId !== null,
        };
      });

      const allProfessors = await ctx.db.user.findMany({
        where: {
          roles: { some: { role: { equals: "PROFESSOR" } } },
        },
        select: { id: true, name: true, email: true },
      });

      return { sections: sectionsWithAllowedFlag, allProfessors };
    }),

  addSectionsToTerm: coordinatorProcedure
    .input(
      z.object({
        year: z.number().int().nonnegative(),
        termLetter: z.nativeEnum(TermLetter),
        sections: z.array(SectionItemSchema),
        replaceExisting: z.boolean().default(false),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: { year, termLetter, sections, replaceExisting },
      }) => {
        const term = await ctx.db.term.findUnique({
          where: { termLetter_year: { termLetter, year } },
          select: { id: true },
        });

        if (!term) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Term ${termLetter} ${year} not found`,
          });
        }

        if (replaceExisting) {
          await ctx.db.section.deleteMany({
            where: { termId: term.id },
          });
        }

        if (sections.length === 0) {
          return { count: 0 };
        }

        const result = await ctx.db.section.createMany({
          data: sections.map((section) => ({
            termId: term.id,
            courseTitle: section.courseTitle,
            courseCode: section.courseCode,
            courseSection: section.courseSection,
            meetingPattern: section.meetingPattern,
            description: section.description,
            professorId: section.professorId,
            enrollment: section.enrollment,
            capacity: section.capacity,
            requiredHours: section.requiredHours,
            academicLevel: section.academicLevel,
          })),
        });

        return { count: result.count };
      },
    ),
});
