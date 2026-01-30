export const solverStrategies = ["greedy", "backTracking"] as const;

export type SolverStrategy = (typeof solverStrategies)[number];

export const solverStrategyMap: Record<
  SolverStrategy,
  {
    label: string;
    description: string;
  }
> = {
  greedy: {
    label: "Greedy",
    description: "Simple and fast i guess",
  },
  backTracking: {
    label: "Back tracking search",
    description: "Takes scheduling into account",
  },
} as const;
