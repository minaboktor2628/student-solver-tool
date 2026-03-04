import z from "zod";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { PreferenceLevel } from "@prisma/client";
import {
  calculateCoverage,
  type CoverageStats,
  type Slot,
} from "@/lib/schedule-coverage";

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

  courseSchedulingNeedsMet: coordinatorProcedure
    .input(termInput)
    .query(async ({ input: { termId }, ctx }) => {
      const sections = await ctx.db.section.findMany({
        where: { termId },
        select: {
          id: true,
          courseCode: true,
          courseSection: true,
          courseTitle: true,
          professorPreference: {
            select: {
              timesRequired: {
                select: { day: true, hour: true },
              },
            },
          },

          assignments: {
            select: {
              staff: {
                select: {
                  roles: true,
                  staffPreferences: {
                    where: { termId },
                    select: {
                      isAvailableForTerm: true,
                      timesAvailable: {
                        select: { day: true, hour: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // findMany returns [] when nothing matches
      if (sections.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      type SectionScheduleCoverage = AssignmentInfo & CoverageStats;

      const perSection: SectionScheduleCoverage[] = [];

      let totalNeeded = 0;
      let totalCovered = 0;

      for (const s of sections) {
        const assignmentInfo: AssignmentInfo = {
          sectionId: s.id,
          courseCode: s.courseCode,
          courseSection: s.courseSection,
          courseTitle: s.courseTitle,
        };

        // Needed slots: professorPreference.timesRequired
        const neededSlots: Slot[] =
          s.professorPreference?.timesRequired.map((t) => ({
            day: t.day,
            hour: t.hour,
          })) ?? [];

        // Available slots: union of timesAvailable from assigned staff (TA/PLA/GLA) who are available this term
        const availableSlots: Slot[] = [];

        for (const a of s.assignments) {
          const staff = a.staff;

          const isStaffRole = staff.roles.some((r) =>
            ["TA", "PLA", "GLA"].includes(r.role),
          );
          if (!isStaffRole) continue;

          const pref = staff.staffPreferences[0] ?? null;
          if (!pref || pref.isAvailableForTerm !== true) continue;

          for (const t of pref.timesAvailable) {
            availableSlots.push({ day: t.day, hour: t.hour });
          }
        }

        const coverage = calculateCoverage(neededSlots, availableSlots);

        totalNeeded += coverage.totalNeeded;
        totalCovered += coverage.totalCovered;

        perSection.push({
          ...assignmentInfo,
          totalNeeded: coverage.totalNeeded,
          totalCovered: coverage.totalCovered,
          percent: coverage.percent,
          covered: coverage.covered,
          uncovered: coverage.uncovered,
        });
      }

      const short = perSection.filter((x) => x.uncovered.length > 0);
      const met = perSection.filter((x) => x.uncovered.length === 0);

      const overallPercent =
        totalNeeded === 0
          ? 100
          : Math.round((totalCovered / totalNeeded) * 100 * 100) / 100;

      // sort "short" by worst coverage first
      short.sort((a, b) => a.percent - b.percent);

      return {
        totals: {
          totalNeeded,
          totalCovered,
          percent: overallPercent,
        },
        short,
        met,
        perSection,
      };
    }),

  courseHelpHoursNeedsMet: coordinatorProcedure
    .input(termInput)
    .query(async ({ input: { termId }, ctx }) => {
      const sections = await ctx.db.section.findMany({
        where: { termId },
        select: {
          id: true,
          courseCode: true,
          courseSection: true,
          courseTitle: true,
          requiredHours: true,
          assignments: {
            select: {
              staff: {
                select: {
                  id: true,
                  hours: true,
                  roles: true,
                  staffPreferences: {
                    where: { termId },
                    select: { isAvailableForTerm: true },
                  },
                },
              },
            },
          },
        },
      });

      if (sections.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      type SectionHours = AssignmentInfo & {
        neededHours: number;
        assignedHours: number;
        delta: number; // assigned - needed (negative => short)
        status: "SHORT" | "OVER" | "MET";
      };

      const perSection: SectionHours[] = [];

      let totalNeededHours = 0;
      let totalAssignedHours = 0;

      for (const s of sections) {
        const neededHours = s.requiredHours ?? 0;
        totalNeededHours += neededHours;

        // sum hours for assigned staff who are (TA/PLA/GLA) AND available this term
        const assignedHours = s.assignments.reduce((sum, a) => {
          const staff = a.staff;

          const isStaffRole = staff.roles.some((r) =>
            ["TA", "PLA", "GLA"].includes(r.role),
          );

          const staffPref = staff.staffPreferences[0] ?? null;
          const isAvailable = staffPref?.isAvailableForTerm === true;

          if (!isStaffRole || !isAvailable) return sum;

          return sum + (staff.hours ?? 0);
        }, 0);

        totalAssignedHours += assignedHours;

        const delta = assignedHours - neededHours;
        const status: SectionHours["status"] =
          delta === 0 ? "MET" : delta < 0 ? "SHORT" : "OVER";

        perSection.push({
          sectionId: s.id,
          courseCode: s.courseCode,
          courseSection: s.courseSection,
          courseTitle: s.courseTitle,
          neededHours,
          assignedHours,
          delta,
          status,
        });
      }

      const short = perSection.filter((x) => x.status === "SHORT");
      const over = perSection.filter((x) => x.status === "OVER");

      return {
        totalNeededHours,
        totalAssignedHours,
        totalsDelta: totalAssignedHours - totalNeededHours,
        short, // list of classes short of hours
        over, // list of classes over hours
        perSection, //  full breakdown
      };
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
