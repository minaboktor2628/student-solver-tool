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

  const courseRegex = /^CS \d{3,4}$/;

  // if the key is like "CS 2023" and the value at that key is true,
  // add that assistant to the available list of assistants for that course
  for (const student of data) {
    for (const [key, value] of Object.entries(student)) {
      if (courseRegex.test(key) && value === true) {
        (courseMap[key] ??= []).push(student);
      }
    }
  }

  return courseMap;
}

export function makeMeetingToAssistantMap(data: AssistantPreferences[]) {
  const courseMap: Record<string, AssistantPreferences[]> = {};

  const meeetingRegex = /^(?<days>[MTWRF](?:-[MTWRF])*)\s*\|?\s*(?<start>\d{1,2}:\d{2}\s[AP]M)\s*-\s*(?<end>\d{1,2}:\d{2}\s[AP]M)$/

  for (const student of data) {
    for (const [key, value] of Object.entries(student)) {
      if (meeetingRegex.test(key) && value === true) {
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
