import type { CtxType } from "@/server/api/trpc";
import { solveBackTracking_v1 } from "./solveBackTracking_v1";
import { greedy } from "./greedy";

export const solverStrategies = ["greedy", "backTracking"] as const;
export type SolverStrategy = (typeof solverStrategies)[number];

// the data we feed the solver function
export type SolverData = Awaited<ReturnType<typeof getSolverData>>;
export type SolverAssignments = Map<string, string[]>; // what each solver function should return: sectionId, staffIds

export const solverStrategyMap: Record<
  SolverStrategy,
  {
    label: string;
    description: string;
    fn: (data: SolverData) => SolverAssignments;
  }
> = {
  greedy: {
    label: "Greedy",
    description: "Does not take scheduling into account.",
    fn: greedy,
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
): SolverAssignments {
  return solverStrategyMap[strategy].fn(solverData);
}

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
