import z from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { PreferenceLevel } from "@prisma/client";

const termInput = z.object({ termId: z.string() });

type AssignmentInfo = {
  sectionId: string;
  courseCode: string;
  courseSection: string;
  courseTitle: string;
};

type UserPreferenceStatus =
  | {
      status: "UNASSIGNED"; // no SectionAssignment in this term
    }
  | {
      status: "GOT_PREFERENCE";
      level: PreferenceLevel; // STRONGLY_PREFER | PREFER etc
      assignment: AssignmentInfo;
    }
  | {
      status: "ASSIGNED_NON_PREFERRED"; // assigned, but not in preferredSections
      assignment: AssignmentInfo;
    }
  | {
      status: "ASSIGNED_NO_PREFS"; // assigned, but user has no StaffPreference or no preferredSections
      assignment: AssignmentInfo;
    };

export const validatorRoute = createTRPCRouter({
  staffGotPreferences: coordinatorProcedure
    .input(termInput)
    .query(async ({ input: { termId }, ctx }) => {
      const term = await ctx.db.term.findUnique({
        where: { id: termId },
        select: {
          id: true,
          termLetter: true,
          year: true,

          allowedUsers: {
            where: {
              // Only users who are staff (non-professors)
              roles: {
                some: {
                  role: { in: ["GLA", "PLA", "TA"] },
                },
              },
              // Only users who have said they are available for this term
              staffPreferences: {
                some: {
                  termId,
                  isAvailableForTerm: true,
                },
              },
            },
            select: {
              id: true,
              name: true,
              email: true,
              roles: { where: { role: { in: ["GLA", "PLA", "TA"] } } },

              // There should be at most one per (user, term)
              staffPreferences: {
                where: { termId, isAvailableForTerm: true },
                select: {
                  id: true,
                  preferredSections: {
                    select: {
                      rank: true, // PREFER | STRONGLY_PREFER
                      sectionId: true,
                      section: {
                        select: {
                          id: true,
                          courseCode: true,
                          courseSection: true,
                          courseTitle: true,
                        },
                      },
                    },
                  },
                },
              },

              // All assignments for this user in this term
              sectionAssignments: {
                where: {
                  section: { termId },
                },
                select: {
                  id: true,
                  section: {
                    select: {
                      id: true,
                      courseCode: true,
                      courseSection: true,
                      courseTitle: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!term) throw new TRPCError({ code: "NOT_FOUND" });

      return term.allowedUsers.map((user) => {
        // app-level guarantee: 0 or 1 section assignment per term
        const assignment = user.sectionAssignments[0] ?? null;
        const staffPref = user.staffPreferences[0] ?? null;
        const preferredSections = staffPref?.preferredSections ?? [];

        if (!assignment) {
          // User is allowed in term but not assigned to any section
          const result: UserPreferenceStatus = { status: "UNASSIGNED" };
          return {
            userId: user.id,
            name: user.name,
            email: user.email,
            result,
          };
        }

        const assignmentInfo: AssignmentInfo = {
          sectionId: assignment.section.id,
          courseCode: assignment.section.courseCode,
          courseSection: assignment.section.courseSection,
          courseTitle: assignment.section.courseTitle,
        };

        if (!staffPref || preferredSections.length === 0) {
          // Assigned but no preferences recorded at all
          const result: UserPreferenceStatus = {
            status: "ASSIGNED_NO_PREFS",
            assignment: assignmentInfo,
          };
          return {
            userId: user.id,
            name: user.name,
            email: user.email,
            result,
          };
        }

        const matchedPref = preferredSections.find(
          (p) => p.sectionId === assignment.section.id,
        );

        if (matchedPref) {
          const result: UserPreferenceStatus = {
            status: "GOT_PREFERENCE",
            level: matchedPref.rank, // STRONGLY_PREFER or PREFER
            assignment: assignmentInfo,
          };
          return {
            userId: user.id,
            name: user.name,
            email: user.email,
            result,
          };
        }

        // Assigned to something they are qualified for (maybe), but not in their preferred list
        const result: UserPreferenceStatus = {
          status: "ASSIGNED_NON_PREFERRED",
          assignment: assignmentInfo,
        };

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          result,
        };
      });
    }),
});
