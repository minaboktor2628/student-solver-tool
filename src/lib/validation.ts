import type { Allocation, Assignment } from "@/types/excel";
import type { AllocationWithAssignment } from "@/types/validation";

export function mergeAllocationsAndAssignments(
  allocations: Allocation[],
  assignments: Assignment[],
): AllocationWithAssignment[] {
  // index assignments by Section string key
  const assignmentMap = new Map(
    assignments.map((a) => [sectionKey(a.Section), a]),
  );

  return allocations.map((alloc) => {
    const assignment = assignmentMap.get(sectionKey(alloc.Section));

    return {
      ...alloc,
      ...(assignment ?? {
        TAs: [],
        PLAs: [],
        GLAs: [],
      }),
    };
  });
}

// Helper: stringify Section as a stable key
export function sectionKey(section: {
  Course: string;
  Subsection: string;
}): string {
  return `${section.Course}-${section.Subsection}`;
}
