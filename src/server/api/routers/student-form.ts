import { z } from "zod";
import { assistantProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";

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
    .query(async ({ input }) => {
      const { userId, termId } = input;

      // TODO: query available hours
      return { availability: [] as unknown[] };
    }),

  getQualifications: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      if (
        !(
          ctx.session.user.roles.includes("COORDINATOR") ||
          ctx.session.user.id === userId
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
      // TODO: query prefer/strong tokens on StaffPreference.StaffPreferencePreferredSection

      return { preferences: {} as Record<string, string> };
    }),

  getComments: assistantProcedure
    .input(baseInput)
    .query(async ({ input: { userId, termId }, ctx }) => {
      // TODO: Query StaffPreference.comments

      return { comments: null as string | null };
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
        },
        ctx,
      }) => {
        if (
          !(
            ctx.session.user.roles.includes("COORDINATOR") ||
            ctx.session.user.id === userId
          )
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
              updatedAt: new Date(),
            },
            create: {
              userId,
              termId: term.id,
              comments: comments ?? null,
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
      const result = await ctx.db.staffPreference.updateMany({
        where: { userId, termId },
        data: { isAvailableForTerm: isAvailable },
      });
      return result;
    }),
});

export default studentFormRoute;
