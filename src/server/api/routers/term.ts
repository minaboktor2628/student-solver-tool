/* Term related endpoints */
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  coordinatorProcedure,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { Role, TermLetter } from "@prisma/client";
import {
  createTermInputSchema,
  createUserInputSchema,
} from "@/types/form-inputs";
import { getDefaultHoursForRole } from "@/lib/constants";
import { getTermSectionData, SectionItemSchema } from "@/lib/courselisting-api";

export const termRoute = createTRPCRouter({
  getTerms: publicProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.term.findMany({
      orderBy: [{ year: "desc" }, { termLetter: "desc" }],
      select: {
        id: true,
        active: true,
        year: true,
        termLetter: true,
        published: true,
        termProfessorDueDate: true,
        termStaffDueDate: true,
      },
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
      select: {
        id: true,
        active: true,
        year: true,
        termLetter: true,
        published: true,
        termProfessorDueDate: true,
        termStaffDueDate: true,
      },
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
        courseCount: term.sections?.length ?? 0,
        peopleCount: term.allowedUsers?.length ?? 0,
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

  publishTerm: coordinatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      await ctx.db.term.updateMany({
        where: { active: true },
        data: { active: false },
      });

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

  syncUsersToTerm: coordinatorProcedure
    .input(
      z.object({
        termId: z.string(),
        users: z.array(createUserInputSchema),
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

      await Promise.all(
        users.map(async ({ email, role }) => {
          const user = await ctx.db.user.findUnique({
            where: { email },
            include: { roles: true },
          });

          if (!user) return; // should not happen, but safeguard

          const roles = user.roles;

          const isTaOrPla = roles.some(
            (r) => r.role === Role.TA || r.role === Role.PLA,
          );

          if (isTaOrPla) {
            // Exception:
            // If user is TA or PLA, the *new* role takes precedence:
            //  -> wipe old roles and set only the new one
            await ctx.db.user.update({
              where: { id: user.id },
              data: {
                roles: {
                  deleteMany: {}, // drop existing roles (TA/PLA)
                  create: { role }, // set only new role
                },
                hours: getDefaultHoursForRole(role),
              },
            });
          } else {
            // Default:
            // Roles always get appended if they don't already have this role
            const alreadyHasRole = roles.some((r) => r.role === role);
            if (!alreadyHasRole) {
              await ctx.db.user.update({
                where: { id: user.id },
                data: {
                  roles: {
                    connectOrCreate: {
                      where: { userId_role: { userId: user.id, role } },
                      create: { role },
                    },
                  },
                },
              });
            }
          }
        }),
      );

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
        console.log({ sections });
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

        if (sections.length === 0)
          return { count: 0, unresolvedProfessorNames: [] as string[] };

        // collect professor names that need resolving (strings only)
        const namesToResolve = Array.from(
          new Set(
            sections
              .filter((s) => !s.professorId)
              .map((s) => s.professorName?.trim())
              .filter((n): n is string => !!n),
          ),
        );

        console.log({ namesToResolve });

        // fetch matching professor users (must have PROFESSOR role)
        const profUsers = namesToResolve.length
          ? await ctx.db.user.findMany({
              where: {
                name: { in: namesToResolve },
                roles: { some: { role: Role.PROFESSOR } },
              },
              select: { id: true, name: true },
            })
          : [];

        // build name->id map (handle null names safely)
        const byName = new Map<string, string>();
        for (const u of profUsers) {
          if (u.name) byName.set(u.name, u.id);
        }

        // resolve professorId for each section
        const data = sections.map((section) => {
          const resolvedProfessorId =
            section.professorId ??
            (section.professorName
              ? byName.get(section.professorName.trim())
              : undefined) ??
            null;

          return {
            termId: term.id,
            courseTitle: section.courseTitle,
            courseCode: section.courseCode,
            courseSection: section.courseSection,
            meetingPattern: section.meetingPattern,
            description: section.description,
            professorId: resolvedProfessorId,
            enrollment: section.enrollment,
            capacity: section.capacity,
            requiredHours: section.requiredHours,
            academicLevel: section.academicLevel,
          };
        });

        const result = await ctx.db.$transaction(async (tx) => {
          // overwrite only conflicts
          await tx.section.deleteMany({
            where: {
              termId: term.id,
              OR: data.map((s) => ({
                courseCode: s.courseCode,
                courseSection: s.courseSection,
              })),
            },
          });

          return tx.section.createMany({ data });
        });

        const unresolvedProfessorNames = namesToResolve.filter(
          (n) => !byName.has(n),
        );

        return { count: result.count, unresolvedProfessorNames };
      },
    ),
});
