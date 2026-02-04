import type { CtxType } from "@/server/api/trpc";
import type { Section, SectionAssignment } from "@prisma/client";
import type { IframeHTMLAttributes } from "react";
import {
  defaultMarginOfErrorShortAllocationHours,
  defaultMarginOfErrorOverAllocationHours,
} from "./constants";

export const solverStrategies = ["greedy", "backTracking"] as const;
export type SolverStrategy = (typeof solverStrategies)[number];

export const solverStrategyMap: Record<
  SolverStrategy,
  {
    label: string;
    description: string;
    fn: (data: SolverData) => void;
  }
> = {
  greedy: {
    label: "Greedy",
    description: "Simple and fast i guess",
    fn: solveGreedy,
  },
  backTracking: {
    label: "BTS v1",
    description: "Takes only qualifications into account",
    fn: solveBackTracking_v1,
  },
} as const;

export function solveAssignments(
  strategy: SolverStrategy,
  solverData: SolverData,
) {
  solverStrategyMap[strategy].fn(solverData);
}

function solveGreedy({ staffPreferences, sections }: SolverData) {
  // TODO:
  return;
}

function solveBackTracking_v1({ staffPreferences, sections }: SolverData) {
  // TODO:
  //  similar to n queens
  //
  //  availableStaff(section) = staffPreferences.filter( available staff ).sort( alphabetical )
  //  solution(section, i) = take from available staff where binaryStr(i)[index of staff] === 1
  //  find first valid solution on section 1
  //  check section 2
  //  if no valid solution, get next available solution on section 1
  //  if no valid solution left on section 1, return error/empty

  // returns user ids for all available staff for given section
  function availableStaff(section: Section): string[] {
    // get all qualifications for section id
    const sectionId = section.id;

    return staffPreferences
      .sort((pref, pref2) =>
        (pref.user.name ?? "") < (pref2.user.name ?? "")
          ? -1
          : (pref.user.name ?? "") > (pref2.user.name ?? "")
            ? 1
            : 0,
      )
      .filter((pref) =>
        pref.qualifiedForSections
          .map((qualifiedSection) => qualifiedSection.sectionId)
          .includes(sectionId),
      )
      .map((pref) => pref.userId);
  }

  // returns section solution (array of user ids) corresponding to encoding i
  function solutionForSection(section: Section, i: number): string[] | null {
    const binaryStr = i.toString(2);
    const staffsToTake = binaryStr.split("").reverse();
    const staffs = availableStaff(section);

    if (staffsToTake.length > staffs.length) {
      return null;
    }

    const solution: string[] = [];

    var j = 0;
    staffsToTake.forEach((binary) => {
      const staff = staffs[j];
      if (binary === "1" && staff !== undefined) {
        solution.push(staff);
      }
      j++;
    });

    // return array of staffIds
    return solution;
  }

  // returns next valid solution for section, after solution corresponding to encoding i
  // a valid solution has all qualified staff and is within hours needed MOE
  // if no remaining valid solutione exists, returns null
  function nextValidSolutionForSection(
    section: Section,
    i: number,
  ): [string[], number] | null {
    var j = i + 1;
    while (true) {
      const sol = solutionForSection(section, j);
      if (sol === null) {
        return null;
      }

      var staffHoursInSolution = 0;
      sol.forEach((userId) => {
        staffHoursInSolution +=
          staffPreferences.find((pref) => pref.user.id === userId)?.user
            .hours ?? 0;
        // TODO catch this case - shouldn't be an issue due to how solution is found, but still should be handled
      });

      // hours good check
      if (
        !(
          staffHoursInSolution >
            section.requiredHours -
              defaultMarginOfErrorShortAllocationHours() &&
          staffHoursInSolution <
            section.requiredHours + defaultMarginOfErrorOverAllocationHours()
        )
      ) {
        //staff good check
        if (!sol.map((userId) => isStaffAlreadyAssigned(userId)).includes(true))
          return [sol, j];
      }

      j++;
    }
  }

  function isStaffAlreadyAssigned(userId: string): boolean {
    for (const [_, staffIds] of solution) {
      if (staffIds.includes(userId)) {
        return true;
      }
    }
    return false;
  }

  function backtrack(sectionIdx: number): boolean {
    // base case: all sections assigned
    if (sectionIdx >= sections.length) {
      return true;
    }

    const section = sections[sectionIdx];
    if (!section) return false;

    const currentIndex = sectionIndices.get(section.id) ?? 0;
    const result = nextValidSolutionForSection(section, currentIndex);

    // no more valid solutions, backtrack
    if (result === null) {
      sectionIndices.set(section.id, 0);
      solution.delete(section.id);
      return false;
    }

    const [staffIds, newSectionIndex] = result;

    solution.set(section.id, staffIds);
    sectionIndices.set(section.id, newSectionIndex);

    if (backtrack(sectionIdx + 1)) {
      return true;
    }

    // Try next solution for this section before giving up
    solution.delete(section.id);
    return backtrack(sectionIdx);
  }

  //  i = 1
  //  next valid solution for section i
  //    if good: next valid solution for section i+1
  //      if good: next valid solution for section i+2
  //      if bad: next valid solution for section i
  //    if bad: return error
  const solution: Map<string, string[]> = new Map();
  const sectionIndices: Map<string, number> = new Map();

  sections.forEach((section) => {
    sectionIndices.set(section.id, 0);
  });

  const success = backtrack(0);

  if (success) {
    console.log("solution found!: ");
    solution.forEach((staffIds, sectionId) => {
      console.log(`Section ${sectionId}: ${staffIds.join(", ")}`);
    });
  } else {
    console.log("No solution found!");
  }

  // TODO post assignments to db
}

// the data we feed the solver function
export type SolverData = Awaited<ReturnType<typeof getSolverData>>;

export async function getSolverData(ctx: CtxType, termId: string) {
  const [sections, staffPreferences] = await Promise.all([
    ctx.db.section.findMany({
      where: { termId },
      include: {
        assignments: true,
        preferredPreferences: true,
        professor: true,
        professorPreference: true,
        qualifiedPreferences: true,
      },
    }),
    ctx.db.staffPreference.findMany({
      where: {
        termId,
        user: {
          // ignore staff who said they are not available this term/semester
          staffPreferences: {
            none: {
              isAvailableForTerm: false,
            },
          },
          // Only return users who are NOT locked to a section already this term
          sectionAssignments: {
            none: {
              locked: true,
              section: {
                termId,
              },
            },
          },
        },
      },
      include: {
        preferredSections: true,
        qualifiedForSections: true,
        timesAvailable: true,
        user: true,
      },
    }),
  ]);

  return { sections, staffPreferences };
}
