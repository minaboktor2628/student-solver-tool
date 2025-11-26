import { z } from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";

export const staffRoute = createTRPCRouter({
  getQualifiedStaffForCourse: coordinatorProcedure
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

        // Qualified + not avoided for this section
        const qualified = await tx.staffPreferenceQualifiedSection.findMany({
          where: {
            sectionId,
            staffPreference: {
              user: {
                avoidedInCourses: {
                  none: { professorPreference: { sectionId } },
                },
              },
            },
          },
          include: {
            staffPreference: {
              select: {
                comments: true,
                timesAvailable: true,
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
                user: {
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
          },
        });

        // Flatten users + roles
        const users = qualified.map(({ staffPreference }) => {
          const u = staffPreference.user;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            hours: u.hours,
            roles: u.roles.map((r) => r.role),
            comments: staffPreference.comments,
            timesAvailable: staffPreference.timesAvailable,
            preferedSections: staffPreference.preferredSections,
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
            section: { select: { courseCode: true, courseSection: true } },
          },
        });

        // Map staffId -> (one) section
        const assignedByStaffId = new Map<string, string>();
        for (const row of assignedRows) {
          // If they can only be assigned once per term, first one wins.
          if (!assignedByStaffId.has(row.staffId)) {
            assignedByStaffId.set(
              row.staffId,
              row.section.courseCode + "-" + row.section.courseSection,
            );
          }
        }

        // Single list with metadata
        const staff = users
          .map((u) => {
            const assignedSection = assignedByStaffId.get(u.id);

            return {
              ...u,
              assignedSection,
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
