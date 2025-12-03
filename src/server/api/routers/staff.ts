import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";

export const staffRoute = createTRPCRouter({
  getStaffForSection: coordinatorProcedure
    .input(z.object({ sectionId: z.string().nullish() }))
    .query(async ({ input: { sectionId }, ctx }) => {
      if (!sectionId) return { staff: [] };

      return ctx.db.$transaction(async (tx) => {
        // Get the term of this section
        const section = await tx.section.findUnique({
          where: { id: sectionId },
          select: { termId: true },
        });
        if (!section) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Section not found",
          });
        }
        const { termId } = section;

        // Qualified (by existence in this table) + dynamic user filters
        const staffPreferences = await tx.staffPreference.findMany({
          where: {
            termId,
            user: {
              sectionAssignments: {
                none: {
                  OR: [
                    { sectionId }, // already assigned to this section
                    { AND: [{ locked: true }, { NOT: { sectionId } }] }, // locked on a different section
                  ],
                },
              },
            },
          },
          include: {
            qualifiedForSections: {
              select: { sectionId: true },
            },
            preferredSections: {
              select: {
                rank: true,
                section: {
                  select: {
                    id: true,
                    courseTitle: true,
                    courseCode: true,
                    courseSection: true,
                  },
                },
              },
            },
            timesAvailable: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                hours: true,
                roles: { select: { role: true } },
                avoidedInCourses: {
                  where: { professorPreference: { sectionId } },
                },
              },
            },
          },
        });

        // Flatten users + roles
        const users = staffPreferences.map((sp) => {
          const u = sp.user;
          const qualifiedForThisSection = sp.qualifiedForSections.some(
            (q) => q.sectionId === sectionId,
          );
          const avoidedByProfessor = u.avoidedInCourses.length > 0;

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            hours: u.hours,
            roles: u.roles.map((r) => r.role),
            comments: sp.comments,
            timesAvailable: sp.timesAvailable,
            preferedSections: sp.preferredSections,
            locked: false,
            flags: {
              qualifiedForThisSection,
              notAvoidedByProfessor: !avoidedByProfessor,
              // we'll fill availableThisTerm after we know assignments
              availableThisTerm: true,
            },
          };
        });

        if (users.length === 0) {
          return { staff: [] };
        }

        const userIds = users.map((u) => u.id);

        // Who is already assigned to *any* section in this term?
        const assignedRows = await tx.sectionAssignment.findMany({
          where: {
            staffId: { in: userIds },
            section: { termId },
          },
          select: {
            staffId: true,
            section: {
              select: { id: true, courseCode: true, courseSection: true },
            },
          },
        });

        // Map staffId -> (one) section
        const assignedByStaffId = new Map<
          string,
          { id: string; code: string }
        >();
        for (const row of assignedRows) {
          // If they can only be assigned once per term, first one wins.
          if (!assignedByStaffId.has(row.staffId)) {
            assignedByStaffId.set(row.staffId, {
              id: row.section.id,
              code: row.section.courseCode + "-" + row.section.courseSection,
            });
          }
        }

        // Build single list with metadata
        const staff = users
          .map((u) => {
            const assignedSection = assignedByStaffId.get(u.id);

            return {
              ...u,
              assignedSection,
              flags: {
                ...u.flags,
                availableThisTerm: !assignedSection,
              },
            };
          })
          .sort((a, b) => {
            // Sort so that true (available) comes before false (not available)
            if (a.assignedSection === b.assignedSection) return 0;
            return a.assignedSection ? 1 : -1;
          });

        return { staff };
      });
    }),
});
