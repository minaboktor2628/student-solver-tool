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
    fn: (data: SolverData) => Map<string, string[]>;
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
): Map<string, string[]> {
  return solverStrategyMap[strategy].fn(solverData);
}

function solveGreedy({
  staffPreferences,
  sections,
}: SolverData): Map<string, string[]> {
  // TODO:
  return new Map();
}

// basic backtracking search
// TODO: no partial solution
// TODO: no student preference consideration
// TODO: no professor preference consideration
// TODO: no hours covered consideration
function solveBackTracking_v1({ staffPreferences, sections }: SolverData) {
  // returns user ids for all available staff for given section
  function availableStaff(section: Section): string[] {
    const sectionId = section.id;

    // get all qualifications for section id
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
    // generate binary string for i
    const binaryStr = i.toString(2);
    const staffsToTake = binaryStr.split("").reverse();
    const staffs = availableStaff(section);

    // i too high
    if (staffsToTake.length > staffs.length) {
      return null;
    }

    const solution: string[] = [];

    // i = 10, staffsToTake = "0101", take staffs[1], staffs[3]
    let j = 0;
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

  // returns total hours of a solution
  function calculateHours(staffIds: string[]): number {
    let total = 0;
    staffIds.forEach((userId) => {
      total +=
        staffPreferences.find((pref) => pref.user.id === userId)?.user.hours ??
        0;
    });
    return total;
  }

  // check if solution is valid (staff not assigned elsewhere and hours within MOE and whether hours are exact)
  function isSolutionValid(
    staffIds: string[],
    section: Section,
  ): { valid: boolean; hours: number; isExact: boolean } {
    const hours = calculateHours(staffIds);

    const hoursAreGood =
      hours >=
        section.requiredHours - defaultMarginOfErrorShortAllocationHours() &&
      hours <=
        section.requiredHours + defaultMarginOfErrorOverAllocationHours();

    const staffAreAllAvailable = !staffIds
      .map((userId) => isStaffAlreadyAssigned(userId))
      .includes(true);

    const isExact = hours === section.requiredHours;

    return {
      valid: hoursAreGood && staffAreAllAvailable,
      hours,
      isExact,
    };
  }

  // returns next valid solution for section, after solution corresponding to encoding i
  // prioritizes exact hour matches > hours over > hours under
  function nextValidSolutionForSection(
    section: Section,
    i: number,
  ): [string[], number] | null {
    let bestSolution: [string[], number] | null = null;
    let bestDistance = Infinity;

    let j = i + 1;
    const maxIterations = 10000; // safety limit to prevent infinite loops
    let iterations = 0;

    while (iterations < maxIterations) {
      const sol = solutionForSection(section, j);
      if (sol === null) {
        // No more solutions to try, return best found
        return bestSolution;
      }

      const validation = isSolutionValid(sol, section);

      if (validation.valid) {
        if (validation.isExact) {
          return [sol, j];
        }

        const distance = validation.hours - section.requiredHours;
        if (distance > 0) {
          bestDistance = distance;
          bestSolution = [sol, j];
        }

        if (iterations > 100 && bestSolution !== null) {
          return bestSolution;
        }
      }

      j++;
      iterations++;
    }

    return bestSolution;
  }

  // returns true if staff already assigned elsewhere
  function isStaffAlreadyAssigned(userId: string): boolean {
    for (const [_, staffIds] of solution) {
      if (staffIds.includes(userId)) {
        return true;
      }
    }
    return false;
  }

  function backtrack(sectionNumber: number): boolean {
    // base case: successfully assigned all sections
    if (sectionNumber >= sections.length) {
      return true;
    }

    const section = sections[sectionNumber];
    if (!section) return false;

    // get current section and index
    const currentIndex = sectionIndices.get(section.id) ?? 0;

    // find next valid solution for current index
    const result = nextValidSolutionForSection(section, currentIndex);

    // no more valid solutions for current section, backtrack
    if (result === null) {
      sectionIndices.set(section.id, 0);
      solution.delete(section.id);
      return false;
    }

    // valid solution found
    const [staffIds, newSectionIndex] = result;

    // set solution
    solution.set(section.id, staffIds);
    sectionIndices.set(section.id, newSectionIndex);

    // keep going to next section
    if (backtrack(sectionNumber + 1)) {
      return true;
    }

    return backtrack(sectionNumber);
  }

  //  i = 1
  //  next valid solution for section i
  //    if good: next valid solution for section i+1
  //      if good: next valid solution for section i+2
  //      if bad: next valid solution for section i
  //    if bad: return error

  const solution = new Map<string, string[]>();
  const sectionIndices = new Map<string, number>();

  sections.forEach((section) => {
    sectionIndices.set(section.id, 0);
  });

  const success = backtrack(0);

  if (success) {
    // console.log("Solution found!: ");
    // solution.forEach((staffIds, sectionId) => {
    //   console.log(`Section ${sectionId}: ${staffIds.join(", ")}`);
    // });
    return solution;
  } else {
    // console.log("No solution found!");
    return new Map();
  }
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
