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
  staffId: z.string().min(1),
  termLetter: z.enum(["A", "B", "C", "D"]),
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
          id: true,
          courseCode: true,
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
          id: it.id,
          code: it.id, // TODO: consider adding a short section code field to the model
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
      const { staffId, termLetter, year } = input;

      // TODO: Implement Prisma query to fetch weekly availability.
      // Suggested model: StaffPreference.timesAvailable (or a dedicated WeeklyAvailability model)
      // Example pseudocode:
      // const pref = await db.staffPreference.findUnique({ where: { userId_termId: { userId: staffId, termId: <resolve termId from termLetter+year> } }, select: { timesAvailable: true } });

      // For now return a placeholder shape so frontend can be wired:
      return { availability: [] as unknown[] };
    }),

  /** Load qualifications (sections the staff previously qualified for) */
  getQualifications: assistantProcedure
    .input(baseInput)
    .query(async ({ input }) => {
      const { staffId, termLetter, year } = input;

      // TODO: Implement Prisma query to fetch StaffPreferenceQualifiedSection entries for this staff & term
      // Suggested steps:
      // 1. Resolve termId from termLetter+year: const term = await db.term.findUnique({ where: { termLetter_year: { termLetter, year }}})
      // 2. Query staffPreference for userId and termId
      // 3. Include qualifiedForSections with section data

      return { qualifiedSectionIds: [] as string[] };
    }),

  /** Load token-based preferences (Prefer / Strong) for the staff for a term */
  getPreferences: assistantProcedure
    .input(baseInput)
    .query(async ({ input }) => {
      const { staffId, termLetter, year } = input;

      // TODO: Implement Prisma query to return preferences mapping.
      // If you persist token-based course preferences, query that table here and build a mapping
      // { "CS 1101": "prefer" | "strong" }

      return { preferences: {} as Record<string, string> };
    }),

  /** Load any free-text comments the staff left for the term */
  getComments: assistantProcedure.input(baseInput).query(async ({ input }) => {
    const { staffId, termLetter, year } = input;

    // TODO: Query StaffPreference.comments or ProfessorPreference.comments depending on role
    // Example: const pref = await db.staffPreference.findUnique({ where: { userId_termId: { userId: staffId, termId }}, select: { comments: true }})

    return { comments: null as string | null };
  }),

  /** Insert or update the complete student form for a staff member and term */
  insertStudentForm: assistantProcedure
    .input(
      baseInput.extend({
        /** The client should pass the full form payload (availability, qualifications, preferences, comments) */
        form: z.any(),
      }),
    )
    .mutation(async ({ input }) => {
      const { staffId, termLetter, year, form } = input;

      // TODO: Implement transactional persistence logic using Prisma.
      // Suggested steps:
      // 1. Resolve or create termId from termLetter+year
      // 2. Upsert StaffPreference row for userId+termId with timesAvailable and comments
      // 3. Upsert qualified sections (StaffPreferenceQualifiedSection) - replace existing entries for this staffPreference
      // 4. Upsert preference tokens (a new table or StaffPreferencePreferredSection if using ranked preferences)
      // 5. Return success status and any created IDs

      return { ok: true };
    }),
});

export default studentFormRoute;
