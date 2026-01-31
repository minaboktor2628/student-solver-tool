import type { CtxType } from "@/server/api/trpc";

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
    label: "Back tracking search",
    description: "Takes scheduling into account",
    fn: solveBackTracking,
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

function solveBackTracking({ staffPreferences, sections }: SolverData) {
  // TODO:
  return;
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
        // Only return users who are NOT locked to a section already this term
        user: {
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
