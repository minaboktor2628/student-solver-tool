import {
  COURSE_RE,
  type Allocation,
  type AllocationWithoutAssistants,
  type Assignment,
  type AssistantPreferences,
} from "@/types/excel";

export function mergeAllocationsAndAssignments(
  allocations: AllocationWithoutAssistants[],
  assignments: Assignment[],
): Allocation[] {
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

  for (const student of data) {
    for (const [key, value] of Object.entries(student)) {
      if (COURSE_RE.test(key) && value === true) {
        courseMap[key] ??= new Set();
        courseMap[key].add(personKey(student));
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
