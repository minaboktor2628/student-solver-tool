import { z } from "zod";
import { assistantProcedure, createTRPCRouter } from "../trpc";
import { db } from "@/server/db";

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
  year: z.number().int().min(1900).max(9999),
});

export const studentFormRoute = createTRPCRouter({
  /** Fetch all sections for a given term, grouped by courseCode */
  getSections: assistantProcedure
    .input(
      z.object({
        termLetter: z.enum(["A", "B", "C", "D"]),
        year: z.number().int().min(1900).max(9999),
      }),
    )
    .query(async ({ input }) => {
      const { termLetter, year } = input;

      // Fetch sections for the requested term and include the professor relation
      const rows = await db.section.findMany({
        where: { term: { termLetter, year } },
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
      const map = new Map<string, any[]>();
      for (const r of rows) {
        const code = r.courseCode ?? "";
        if (!map.has(code)) map.set(code, []);
        map.get(code)!.push(r);
      }

      const courses = Array.from(map.entries()).map(([courseCode, items]) => ({
        code: courseCode,
        title: items[0].courseTitle,
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
      }));

      return { courses };
    }),

  /** Load weekly availability for a staff member for a term */
  getWeeklyAvailability: assistantProcedure
    .input(baseInput)
    .query(async ({ input }) => {
      const { userId, termLetter, year } = input;

      // TODO: Implement Prisma query to fetch weekly availability.
      // Suggested model: StaffPreference.timesAvailable (or a dedicated WeeklyAvailability model)
      // Example pseudocode:
      // const pref = await db.staffPreference.findUnique({ where: { userId_termId: { userId, termId: <resolve termId from termLetter+year> } }, select: { timesAvailable: true } });

      // For now return a placeholder shape so frontend can be wired:
      return { availability: [] as unknown[] };
    }),

  /** Load qualifications (sections the staff previously qualified for) */
  getQualifications: assistantProcedure
    .input(baseInput)
    .query(async ({ input }) => {
      const { userId, termId, year } = input;

      // TODO: Implement Prisma query to fetch StaffPreferenceQualifiedSection entries for this staff & term
      // Suggested steps:
      // 1. Resolve termId from termLetter+year: const term = await db.term.findUnique({ where: { termLetter_year: { termLetter, year }}})
      // 2. Query staffPreference for userId and termId
      // 3. Include qualifiedForSections with section data

      qualifiedSections: return { qualifiedSectionIds: [] as string[] };
    }),

  /** Load token-based preferences (Prefer / Strong) for the staff for a term */
  getPreferences: assistantProcedure
    .input(baseInput)
    .query(async ({ input }) => {
      const { userId, termId, year } = input;

      // TODO: Implement Prisma query to return preferences mapping.
      // If you persist token-based course preferences, query that table here and build a mapping
      // { "CS 1101": "prefer" | "strong" }

      return { preferences: {} as Record<string, string> };
    }),

  /** Load any free-text comments the staff left for the term */
  getComments: assistantProcedure.input(baseInput).query(async ({ input }) => {
    const { userId, termId, year } = input;

    // TODO: Query StaffPreference.comments or ProfessorPreference.comments depending on role
    // Example: const pref = await db.staffPreference.findUnique({ where: { userId_termId: { userId: staffId, termId }}, select: { comments: true }})

    return { comments: null as string | null };
  }),

  /** Insert or update the complete student form for a staff member and term */
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
    .mutation(async ({ input }) => {
      const {
        userId,
        termId,
        year,
        weeklyAvailability,
        qualifiedSectionIds,
        sectionPreferences,
        comments,
      } = input;

      const result = await db.$transaction(async (tx) => {
        // 1. Resolve termId from termLetter+year
        const term = await tx.term.findUniqueOrThrow({
          where: { termLetter_year: { termLetter, year } },
        });

        // 2. Upsert StaffPreference for userId+termId
        const staffPref = await tx.staffPreference.upsert({
          where: { userId_termId: { userId, termId: term.id } },
          update: {
            comments: comments || null,
            updatedAt: new Date(),
          },
          create: {
            userId,
            termId: term.id,
            comments: comments || null,
          },
        });

        // 3. Upsert qualified sections (replace existing)
        if (qualifiedSectionIds && qualifiedSectionIds.length > 0) {
          // Delete existing qualifications
          await tx.staffPreferenceQualifiedSection.deleteMany({
            where: { staffPreferenceId: staffPref.id },
          });
          // Create new qualifications
          await tx.staffPreferenceQualifiedSection.createMany({
            data: qualifiedSectionIds.map((sectionId) => ({
              staffPreferenceId: staffPref.id,
              sectionId,
            })),
          });
        }

        // 4. Upsert preferred sections (replace existing)
        if (sectionPreferences && Object.keys(sectionPreferences).length > 0) {
          // Delete existing preferences
          await tx.staffPreferencePreferredSection.deleteMany({
            where: { staffPreferenceId: staffPref.id },
          });
          // Create new preferences
          for (const [sectionId, rank] of Object.entries(sectionPreferences)) {
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

        // 5. Upsert availability times (replace existing)
        if (weeklyAvailability && weeklyAvailability.length > 0) {
          // Delete existing availability
          await tx.staffAvailableHour.deleteMany({
            where: { staffPreferenceId: staffPref.id },
          });
          // Create new availability
          await tx.staffAvailableHour.createMany({
            data: weeklyAvailability.map(({ day, hour }) => ({
              day: day as any,
              hour,
              staffPreferenceId: staffPref.id,
            })),
          });
        }

        return { ok: true, staffPreferenceId: staffPref.id };
      });

      return result;
    }),
});

export default studentFormRoute;
