import { z } from "zod";
import { assistantProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hasPermission } from "@/lib/permissions";
import { isUserAllowedInActiveTerm } from "@/lib/permission-helpers";
import {
  allowedPreferTokens,
  allowedStrongTokens,
} from "@/components/staff/MultiStepForm/form-entry-preferences";

import type { Day } from "@prisma/client";

// TODO: either refactor these to utils or move the slotToDate logic to the frontend
type Slot = {
  day: Day;
  hour: number;
};

function slotToDate(slot: Slot) {
  const dayMap: Record<Day, number> = {
    M: 0,
    T: 1,
    W: 2,
    R: 3,
    F: 4,
  };

  const START = new Date(1970, 0, 5);
  // Clone and normalize to midnight
  const base = new Date(START);
  base.setHours(0, 0, 0, 0);

  // Compute the target day in that same week
  const d = new Date(base);
  d.setDate(base.getDate() + dayMap[slot.day]);

  // Support fractional hours: 9.5 -> 9:30
  const hours = Math.floor(slot.hour);
  const minutes = Math.round((slot.hour - hours) * 60);
  d.setHours(hours, minutes, 0, 0);

  return d;
}

/**
 * Router: studentFormRoute
 *
 * Provides read endpoints for loading an assistant's existing form state (weekly availability,
 * qualifications, preferences, comments) and a single upsert mutation `insertStudentForm` to
 * persist the complete form. All procedures are protected using `assistantProcedure` so only
 * authenticated PLAs/TAs can call them.
 */
const baseInput = z.object({
  userId: z.string().min(1),
  termId: z.string().min(1),
});

export const studentFormRoute = createTRPCRouter({
  getCanEdit: assistantProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input: { userId }, ctx }) => {
      const canEdit = await ctx.db.user.findUnique({
        where: { id: userId },
        select: {
          canEditForm: true,
        },
      });
      return { canEdit };
    }),

  /** Fetch all sections for a given term, grouped by courseCode */
  getSections: assistantProcedure
    .input(z.object({ termId: z.string() }))
    .query(async ({ input: { termId }, ctx }) => {
      // Fetch sections for the requested term and include the professor relation
      const rows = await ctx.db.section.findMany({
        where: { term: { id: termId } },
        select: {
          term: { select: { termLetter: true, year: true } },
          id: true,
          description: true,
          courseCode: true,
          courseSection: true,
          courseTitle: true,
          enrollment: true,
          capacity: true,
          academicLevel: true,
          professor: { select: { id: true, name: true } },
        },
        orderBy: [{ courseCode: "asc" }, { courseTitle: "asc" }],
      });

      // Group by courseCode to build Course[] shape expected by the frontend
      const courseMap = new Map<string, (typeof rows)[0][]>();
      for (const r of rows) {
        const code = r.courseCode ?? "";
        if (!courseMap.has(code)) courseMap.set(code, []);
        courseMap.get(code)!.push(r);
      }

      const sections = Array.from(courseMap.entries()).map(
        ([courseCode, items]) => ({
          code: courseCode,
          title: items[0] ? items[0].courseTitle : "",
          description: items[0] ? items[0].description : "",
          sections: items.map((it) => ({
            term: it.term.termLetter,
            id: it.id,
            courseSection: it.courseSection,
            instructor: it.professor?.name ?? null,
            enrollment: it.enrollment,
            capacity: it.capacity,
            academicLevel: it.academicLevel,
            professor: it.professor
              ? { id: it.professor.id, name: it.professor.name }
              : null,
          })),
        }),
      );

      return { sections };
    }),

  getWeeklyAvailability: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      if (
        !hasPermission(
          ctx.session.user,
          "staffPreferenceForm",
          "viewActiveTerm",
          {
            userId,
            isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
              ctx.session.user.id,
            ),
          },
        )
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot access qualifications for other users.`,
        });
      }

      const row = await ctx.db.staffPreference.findUnique({
        where: {
          userId_termId: { userId, termId },
        },
        include: {
          timesAvailable: true,
        },
      });

      let output = [] as Date[];
      output =
        row?.timesAvailable.map((r) => {
          return slotToDate({ day: r.day, hour: r.hour });
        }) ?? [];

      return { availability: output };
    }),

  getQualifications: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      if (
        !hasPermission(
          ctx.session.user,
          "staffPreferenceForm",
          "viewActiveTerm",
          {
            userId,
            isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
              ctx.session.user.id,
            ),
          },
        )
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot access qualifications for other users.`,
        });
      }

      // Find the staff preference for this user and term
      const staffPref = await ctx.db.staffPreference.findUnique({
        where: { userId_termId: { userId, termId } },
        include: {
          qualifiedForSections: {
            select: {
              sectionId: true,
            },
          },
        },
      });

      // Extract section IDs from the qualified sections
      const qualifiedSectionIds =
        staffPref?.qualifiedForSections.map((q) => q.sectionId) ?? [];

      return { qualifiedSectionIds };
    }),

  getPreferences: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      if (
        !hasPermission(
          ctx.session.user,
          "staffPreferenceForm",
          "viewActiveTerm",
          {
            userId,
            isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
              ctx.session.user.id,
            ),
          },
        )
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot access qualifications for other users.`,
        });
      }

      const row = await ctx.db.staffPreference.findUnique({
        where: { userId_termId: { userId, termId } },
        include: {
          preferredSections: true,
        },
      });

      const output = {} as Record<string, "prefer" | "strong" | undefined>;
      row?.preferredSections?.forEach((r) => {
        output[r.sectionId] =
          r.rank === "STRONGLY_PREFER" ? "strong" : "prefer";
      }) ?? [];

      return { preferences: output };
    }),

  getComments: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      const row = await ctx.db.staffPreference.findUnique({
        where: { userId_termId: { userId, termId } },
        select: { comments: true },
      });

      return { comments: row?.comments ?? null };
    }),

  saveStudentForm: assistantProcedure
    .input(
      baseInput.extend({
        /** The client should pass the full form payload (availability, qualifications, preferences, comments) */
        weeklyAvailability: z
          .array(
            z.object({
              day: z.enum(["M", "T", "W", "R", "F"]),
              hour: z.number(),
            }),
          )
          .optional(),
        qualifiedSectionIds: z.array(z.string()).optional(),
        isAvailableForTerm: z.boolean().optional(),
        sectionPreferences: z
          .record(z.string(), z.enum(["prefer", "strong"]).optional())
          .optional(),
        comments: z.string().optional(),
      }),
    )
    .mutation(
      async ({
        input: {
          userId,
          termId,
          weeklyAvailability,
          qualifiedSectionIds,
          sectionPreferences,
          comments,
          isAvailableForTerm,
        },
        ctx,
      }) => {
        if (
          !hasPermission(ctx.session.user, "staffPreferenceForm", "create", {
            userId,
            isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
              ctx.session.user.id,
            ),
          })
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Cannot access qualifications for other users.`,
          });
        }

        const result = await ctx.db.$transaction(async (tx) => {
          // 1. Verify user exists
          const user = await tx.user.findUnique({
            where: { id: userId },
          });

          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `User with ID ${userId} not found.`,
            });
          }

          if (!user.canEditForm) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "No permission to edit form.",
            });
          }

          // 2. Verify term exists
          const term = await tx.term.findUniqueOrThrow({
            where: { id: termId },
          });

          if (!term) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Term with ID ${termId} not found.`,
            });
          }

          // 3. Upsert StaffPreference
          const staffPref = await tx.staffPreference.upsert({
            where: { userId_termId: { userId, termId: term.id } },
            update: {
              ...(comments !== undefined && { comments: comments || null }),
              isAvailableForTerm,
            },
            create: {
              userId,
              termId: term.id,
              comments: comments ?? null,
              isAvailableForTerm,
            },
          });

          // 4. Upsert qualified sections (replace existing)
          if (qualifiedSectionIds !== undefined) {
            // Delete existing qualifications
            await tx.staffPreferenceQualifiedSection.deleteMany({
              where: { staffPreferenceId: staffPref.id },
            });
            // Create new qualifications if array is not empty
            if (qualifiedSectionIds.length > 0) {
              await tx.staffPreferenceQualifiedSection.createMany({
                data: qualifiedSectionIds.map((sectionId) => ({
                  staffPreferenceId: staffPref.id,
                  sectionId,
                })),
              });
            }
            // Set isAvailableForTerm to false if array is empty
            else {
              await tx.staffPreference.update({
                where: { userId_termId: { userId, termId } },
                data: { isAvailableForTerm: false },
              });
            }
          }

          // 5. Upsert preferred sections (replace existing)
          if (
            sectionPreferences &&
            Object.keys(sectionPreferences).length > 0
          ) {
            // Delete existing preferences
            await tx.staffPreferencePreferredSection.deleteMany({
              where: { staffPreferenceId: staffPref.id },
            });

            // Ensure max 3 prefer, 1 strong prefer
            const preferCount = Object.entries(sectionPreferences).filter(
              ([, rank]) => rank === "prefer",
            ).length;
            if (preferCount > allowedPreferTokens) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Cannot prefer more than 3 sections.`,
              });
            }

            const strongPreferCount = Object.entries(sectionPreferences).filter(
              ([, rank]) => rank === "strong",
            ).length;
            if (strongPreferCount > allowedStrongTokens) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Cannot strongly prefer more than 1 section.`,
              });
            }

            // Create new preferences
            for (const [sectionId, rank] of Object.entries(
              sectionPreferences,
            )) {
              if (rank) {
                await tx.staffPreferencePreferredSection.create({
                  data: {
                    staffPreferenceId: staffPref.id,
                    sectionId,
                    rank: rank === "strong" ? "STRONGLY_PREFER" : "PREFER",
                  },
                });
              }
            }
          }

          // 6. Upsert availability times (replace existing)
          if (weeklyAvailability && weeklyAvailability.length > 0) {
            // Delete existing availability
            await tx.staffAvailableHour.deleteMany({
              where: { staffPreferenceId: staffPref.id },
            });
            // Create new availability
            await tx.staffAvailableHour.createMany({
              data: weeklyAvailability.map(({ day, hour }) => ({
                day,
                hour,
                staffPreferenceId: staffPref.id,
              })),
            });
          }

          return { ok: true, staffPreferenceId: staffPref.id };
        });

        return result;
      },
    ),

  setAvailabilityForTerm: assistantProcedure
    .input(
      baseInput.extend({
        isAvailable: z.boolean(),
      }),
    )
    .mutation(async ({ input: { userId, termId, isAvailable }, ctx }) => {
      if (
        !hasPermission(ctx.session.user, "staffPreferenceForm", "update", {
          userId,
          isAllowedInActiveTerm: await isUserAllowedInActiveTerm(
            ctx.session.user.id,
          ),
        })
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot access qualifications for other users.`,
        });
      }

      const result = await ctx.db.staffPreference.upsert({
        where: { userId_termId: { userId, termId } },
        update: {
          isAvailableForTerm: isAvailable,
        },
        create: {
          userId,
          termId,
          isAvailableForTerm: isAvailable,
        },
      });
      return result;
    }),
});

export default studentFormRoute;
