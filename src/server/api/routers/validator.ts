import z from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { PreferenceLevel } from "@prisma/client";

const termInput = z.object({ termId: z.string() });

export type AssignmentInfo = {
  sectionId: string;
  courseCode: string;
  courseSection: string;
  courseTitle: string;
};

type UserInfo = {
  userId: string;
  name: string;
  email: string;
  roles: string[];
};

type IllegalReason = {
  unavailableForTerm: boolean;
  notQualifiedForSection: boolean;
  professorAvoidedStaff: boolean;
};

export type IllegalAssignment = {
  assignment: AssignmentInfo;
  user: UserInfo;
};

export const validatorRoute = createTRPCRouter({
  staffAssignmentPreferences: coordinatorProcedure
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

      const grouped: {
        unassigned: { user: UserInfo }[];
        gotPreference: {
          user: UserInfo;
          level: PreferenceLevel;
          assignment: AssignmentInfo;
        }[];
        assignedButDidntGetPreferences: {
          user: UserInfo;
          assignment: AssignmentInfo;
        }[];
        assignedButNoPreferencesSubmitted: {
          user: UserInfo;
          assignment: AssignmentInfo;
        }[];
      } = {
        unassigned: [],
        gotPreference: [],
        assignedButDidntGetPreferences: [],
        assignedButNoPreferencesSubmitted: [],
      };

      for (const user of term.allowedUsers) {
        const assignment = user.sectionAssignments[0] ?? null;
        const staffPref = user.staffPreferences[0] ?? null;
        const preferredSections = staffPref?.preferredSections ?? [];

        if (!assignment) {
          grouped.unassigned.push({
            user: {
              userId: user.id,
              name: user.name ?? "",
              email: user.email ?? "",
              roles: user.roles.map((r) => r.role),
            },
          });

          continue;
        }

        const assignmentInfo: AssignmentInfo = {
          sectionId: assignment.section.id,
          courseCode: assignment.section.courseCode,
          courseSection: assignment.section.courseSection,
          courseTitle: assignment.section.courseTitle,
        };

        if (!staffPref || preferredSections.length === 0) {
          // Assigned but no preferences recorded at all
          grouped.assignedButNoPreferencesSubmitted.push({
            assignment: assignmentInfo,
            user: {
              userId: user.id,
              name: user.name ?? "",
              email: user.email ?? "",
              roles: user.roles.map((r) => r.role),
            },
          });
          continue;
        }

        const matchedPref = preferredSections.find(
          (p) => p.sectionId === assignment.section.id,
        );

        if (matchedPref) {
          grouped.gotPreference.push({
            level: matchedPref.rank,
            assignment: assignmentInfo,
            user: {
              userId: user.id,
              name: user.name ?? "",
              email: user.email ?? "",
              roles: user.roles.map((r) => r.role),
            },
          });

          continue;
        }

        // Assigned to something they are qualified for (maybe), but not in their preferred list
        grouped.assignedButDidntGetPreferences.push({
          assignment: assignmentInfo,
          user: {
            userId: user.id,
            name: user.name ?? "",
            email: user.email ?? "",
            roles: user.roles.map((r) => r.role),
          },
        });
      }

      return { grouped };
    }),

  professorCoverage: coordinatorProcedure
    .input(termInput)
    .query(async ({ input: { termId }, ctx }) => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED" });
    }),

  illegalAssignment: coordinatorProcedure
    .input(termInput)
    .query(async ({ input: { termId }, ctx }) => {
      const assignments = await ctx.db.sectionAssignment.findMany({
        where: {
          section: {
            termId,
          },
        },
        select: {
          id: true,
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: true,
              staffPreferences: {
                where: { termId },
                select: {
                  id: true,
                  isAvailableForTerm: true,
                  qualifiedForSections: {
                    select: {
                      sectionId: true,
                    },
                  },
                },
              },
            },
          },
          section: {
            select: {
              id: true,
              courseCode: true,
              courseSection: true,
              courseTitle: true,
              professorPreference: {
                select: {
                  avoidedStaff: {
                    select: {
                      staffId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const notAvailableForTermAssignments: IllegalAssignment[] = [];
      const notQualifiedForSectionAssignments: IllegalAssignment[] = [];
      const professorAvoidedStaffAssignments: IllegalAssignment[] = [];

      for (const a of assignments) {
        const staffPref = a.staff.staffPreferences[0] ?? null;

        // "Unavailable" includes:
        // - no preference form at all
        // - or form exists but isAvailableForTerm === false
        const isUnavailableForTerm = !staffPref?.isAvailableForTerm;

        const qualifiedSectionIds = new Set(
          staffPref?.qualifiedForSections.map((q) => q.sectionId) ?? [],
        );

        const isNotQualifiedForSection =
          !staffPref || !qualifiedSectionIds.has(a.section.id);

        const isProfessorAvoidedStaff =
          !!a.section.professorPreference &&
          a.section.professorPreference.avoidedStaff.some(
            (s) => s.staffId === a.staff.id,
          );

        const reasons: IllegalReason = {
          unavailableForTerm: isUnavailableForTerm,
          notQualifiedForSection: isNotQualifiedForSection,
          professorAvoidedStaff: isProfessorAvoidedStaff,
        };

        // Only keep it if there is at least one illegal reason
        if (
          reasons.unavailableForTerm ||
          reasons.notQualifiedForSection ||
          reasons.professorAvoidedStaff
        ) {
          const assignmentInfo: AssignmentInfo = {
            sectionId: a.section.id,
            courseCode: a.section.courseCode,
            courseSection: a.section.courseSection,
            courseTitle: a.section.courseTitle,
          };

          const userInfo: UserInfo = {
            userId: a.staff.id,
            name: a.staff.name ?? "",
            email: a.staff.email ?? "",
            roles: a.staff.roles.map((r) => r.role),
          };

          const illegalAssignment: IllegalAssignment = {
            assignment: assignmentInfo,
            user: userInfo,
          };

          if (reasons.unavailableForTerm) {
            notAvailableForTermAssignments.push(illegalAssignment);
          }
          if (reasons.notQualifiedForSection) {
            notQualifiedForSectionAssignments.push(illegalAssignment);
          }
          if (reasons.professorAvoidedStaff) {
            professorAvoidedStaffAssignments.push(illegalAssignment);
          }
        }
      }

      return {
        notAvailableForTerm: notAvailableForTermAssignments,
        notQualifiedForSection: notQualifiedForSectionAssignments,
        professorAvoidedStaff: professorAvoidedStaffAssignments,
        anyIllegalAssignments:
          notAvailableForTermAssignments.length > 0 ||
          notQualifiedForSectionAssignments.length > 0 ||
          professorAvoidedStaffAssignments.length > 0,
      };
    }),
});
