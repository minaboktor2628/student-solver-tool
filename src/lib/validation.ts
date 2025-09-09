import type {
  Allocation,
  Assignment,
  AssistantPreferences,
} from "@/types/excel";
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

export function makeCourseToAssistantMap(data: AssistantPreferences[]) {
  const courseMap: Record<string, Set<string>> = {};

  const courseRegex = /^CS \d{3,4}$/;

  for (const student of data) {
    for (const [key, value] of Object.entries(student)) {
      if (courseRegex.test(key) && value === true) {
        courseMap[key] ??= new Set();
        const id = `${student.First} ${student.Last}`;
        courseMap[key].add(id);
      }
    }
  }
  return courseMap;
}

// Helper: stringify Section as a stable key
export function sectionKey(section: {
  Course: string;
  Subsection: string;
}): string {
  return `${section.Course}-${section.Subsection}`;
}

export function personKey<T extends { First: string; Last: string }>(s: T) {
  return `${s.First} ${s.Last}`;
}
