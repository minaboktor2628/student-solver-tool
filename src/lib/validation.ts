import type {
  Allocation,
  AllocationWithoutAssistants,
  Assignment,
  Assistant,
  AssistantPreferences,
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
  const courseMap: Record<string, AssistantPreferences[]> = {};

  const courseRegex = /^[A-Z]{2,4} \d{3,4}$/;

  for (const student of data) {
    for (const [key, value] of Object.entries(student)) {
      if (courseRegex.test(key) && value === true) {
        (courseMap[key] ??= []).push(student);
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

export function personKey(s: Partial<Assistant>) {
  return `${s.First} ${s.Last}`;
}
