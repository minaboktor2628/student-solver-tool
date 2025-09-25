// __tests__/validation.test.ts
import { describe, it, expect } from "vitest";
import {
  mergeAllocationsAndAssignments,
  makeCourseToAssistantMap,
  makeMeetingToAssistantMap,
  sectionKey,
  personKey,
} from "@/lib/validation";
import {
  AssistantPreferencesSchema,
  AllocationWithoutAssistantsSchema,
  AssignmentSchema,
} from "@/types/excel";
import type {
  AssistantPreferences,
  AllocationWithoutAssistants,
  Assignment,
} from "@/types/excel";

// Test data factories using Zod parsing to ensure correct types
function createTestAssistantPreferences(
  overrides: Record<string, any> = {},
): AssistantPreferences {
  const baseData = {
    First: "Roman",
    Last: "Anthony",
    Email: "ranthony@wpi.edu",
    Comments: null,
    Available: true,
    "CS 101": false,
    "CS 202": false,
    ...overrides,
  };

  return AssistantPreferencesSchema.parse(baseData);
}

function createTestAllocationWithoutAssistants(
  overrides: Record<string, any> = {},
): AllocationWithoutAssistants {
  const baseData = {
    "Academic Period": "Fall 2024",
    Section: "CS 101-A01", // Will be parsed by SectionSchema
    CrossListed: false,
    "Meeting Pattern(s)": "MWF 10:00-10:50",
    Instructors: "Prof. Smith",
    "Reserved Cap": null,
    "Cap Breakdown": null,
    "Section Cap": 30,
    Enrollment: 25,
    "Waitlist Count": 0,
    "Student Hour Allocation": 20, // Will be parsed to include MOE values
    ...overrides,
  };

  return AllocationWithoutAssistantsSchema.parse(baseData);
}

function createTestAssignment(overrides: Record<string, any> = {}): Assignment {
  const baseData = {
    "Academic Period": "Fall 2024",
    Section: "CS 101-A01", // Will be parsed by SectionSchema
    CrossListed: false,
    "Meeting Pattern(s)": "MWF 10:00-10:50",
    Instructors: "Prof. Smith",
    "Reserved Cap": null,
    "Cap Breakdown": null,
    "Section Cap": 30,
    Enrollment: 25,
    "Waitlist Count": 0,
    TAs: [],
    PLAs: [],
    GLAs: [],
    ...overrides,
  };

  return AssignmentSchema.parse(baseData);
}

describe("Validation Helper Functions", () => {
  describe("sectionKey", () => {
    it("should create a stable key from section data", () => {
      const section = { Course: "CS 101", Subsection: "A01" };
      expect(sectionKey(section)).toBe("CS 101-A01");
    });

    it("should handle different subsection formats", () => {
      const section1 = { Course: "CS 202", Subsection: "AL01" };
      const section2 = { Course: "CS 1234", Subsection: "B02" };

      expect(sectionKey(section1)).toBe("CS 202-AL01");
      expect(sectionKey(section2)).toBe("CS 1234-B02");
    });

    it("should handle different department codes", () => {
      const section1 = { Course: "MA 1023", Subsection: "A01" };
      const section2 = { Course: "PHYS 1111", Subsection: "AL01" };

      expect(sectionKey(section1)).toBe("MA 1023-A01");
      expect(sectionKey(section2)).toBe("PHYS 1111-AL01");
    });
  });

  describe("personKey", () => {
    it("should create a person key from first and last name", () => {
      const person = { First: "Roman", Last: "Anthony" };
      expect(personKey(person)).toBe("Roman Anthony");
    });

    it("should handle names with spaces and hyphens", () => {
      const person = { First: "Isiah", Last: "Kiner-Falefa" };
      expect(personKey(person)).toBe("Isiah Kiner-Falefa");
    });

    it("should handle empty names gracefully", () => {
      const person = { First: "", Last: "Anthony" };
      expect(personKey(person)).toBe(" Anthony");

      const person2 = { First: "Roman", Last: "" };
      expect(personKey(person2)).toBe("Roman ");
    });

    it("should handle partial objects", () => {
      const person = { First: "Roman" };
      expect(personKey(person)).toBe("Roman undefined");
    });

    it("should handle special characters in names", () => {
      const person = { First: "Kiké", Last: "Hernandez" };
      expect(personKey(person)).toBe("Kiké Hernandez");
    });
  });

  describe("makeCourseToAssistantMap", () => {
    it("should map courses to qualified assistants", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Wilyer",
          Last: "Abreu",
          Email: "wabreu@wpi.edu",
          "CS 101": true,
          "CS 202": false,
        }),
        createTestAssistantPreferences({
          First: "Alex",
          Last: "Bregman",
          Email: "abregman@wpi.edu",
          "CS 101": true,
          "CS 303": true,
        }),
        createTestAssistantPreferences({
          First: "Kristian",
          Last: "Campbell",
          Email: "kcampbell@wpi.edu",
          Available: false,
          "CS 202": true,
        }),
      ];

      const courseMap = makeCourseToAssistantMap(preferences);

      // Check that the correct assistants are mapped to CS 101
      const cs101Assistants = courseMap["CS 101"] || [];
      const cs101Names = cs101Assistants.map(personKey);

      expect(cs101Names).toContain("Wilyer Abreu");
      expect(cs101Names).toContain("Alex Bregman");
      expect(cs101Names).not.toContain("Kristian Campbell");

      // Check CS 303
      const cs303Assistants = courseMap["CS 303"] || [];
      const cs303Names = cs303Assistants.map(personKey);

      expect(cs303Names).toContain("Alex Bregman");
      expect(cs303Names).not.toContain("Wilyer Abreu");

      // Check CS 202 (Kristian should be included regardless of Available status)
      const cs202Assistants = courseMap["CS 202"] || [];
      const cs202Names = cs202Assistants.map(personKey);

      expect(cs202Names).toContain("Kristian Campbell");
    });

    it("should ignore non-course fields", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Brock",
          Last: "Holt",
          Email: "bholt@wpi.edu",
          "CS 101": true,
          Available: true, // This should be ignored
          Comments: null, // This should be ignored
        }),
      ];

      const courseMap = makeCourseToAssistantMap(preferences);

      // Check that Brock is mapped to CS 101
      const cs101Assistants = courseMap["CS 101"] || [];
      const cs101Names = cs101Assistants.map(personKey);

      expect(cs101Names).toContain("Brock Holt");

      // Check that non-course fields are not in the map
      expect(courseMap["Available"]).toBeUndefined();
      expect(courseMap["Comments"]).toBeUndefined();
      expect(courseMap["Email"]).toBeUndefined();
    });

    it("should only include courses that match CS pattern", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Garrett",
          Last: "Whitlock",
          Email: "gwhitlock@wpi.edu",
          "CS 101": true, // Should be included
          "CS 1234": true, // Should be included
          "MA 1023": true, // Should be included
          "PHYS 1111": true, // Should be included
        }),
      ];

      const courseMap = makeCourseToAssistantMap(preferences);

      expect(courseMap["CS 101"]).toBeDefined();
      expect(courseMap["CS 1234"]).toBeDefined();
      expect(courseMap["MA 1023"]).toBeDefined();
      expect(courseMap["PHYS 1111"]).toBeDefined();
    });

    it("should only include courses where value is true", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Rafael",
          Last: "Devers",
          Email: "rdevers@wpi.edu",
          "CS 101": true,
          "CS 202": false,
          "CS 303": null,
        }),
      ];

      const courseMap = makeCourseToAssistantMap(preferences);

      expect(courseMap["CS 101"]).toBeDefined();
      expect(courseMap["CS 202"]).toBeUndefined();
      expect(courseMap["CS 303"]).toBeUndefined();
    });

    it("should handle empty preferences array", () => {
      const courseMap = makeCourseToAssistantMap([]);
      expect(Object.keys(courseMap)).toHaveLength(0);
    });

    it("should handle assistants with no course preferences", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Triston",
          Last: "Casas",
          Email: "tcasas@wpi.edu",
          // No course preferences
        }),
      ];

      const courseMap = makeCourseToAssistantMap(preferences);
      expect(Object.keys(courseMap)).toHaveLength(0);
    });

    it("should handle multiple assistants for same course", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Connor",
          Last: "Wong",
          Email: "cwong@wpi.edu",
          "CS 101": true,
        }),
        createTestAssistantPreferences({
          First: "Jarren",
          Last: "Duran",
          Email: "jduran@wpi.edu",
          "CS 101": true,
        }),
        createTestAssistantPreferences({
          First: "Ceddanne",
          Last: "Rafaela",
          Email: "crafaela@wpi.edu",
          "CS 101": true,
        }),
      ];

      const courseMap = makeCourseToAssistantMap(preferences);
      const cs101Assistants = courseMap["CS 101"] || [];

      expect(cs101Assistants).toHaveLength(3);
      expect(cs101Assistants.map(personKey)).toContain("Connor Wong");
      expect(cs101Assistants.map(personKey)).toContain("Jarren Duran");
      expect(cs101Assistants.map(personKey)).toContain("Ceddanne Rafaela");
    });
  });

  describe("makeMeetingToAssistantMap", () => {
    it("should map meeting patterns to available assistants", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Wilyer",
          Last: "Abreu",
          Email: "wabreu@wpi.edu",
          "M-T-R-F | 10:00 AM - 10:50 AM": true,
          "T-F | 3:00 PM - 4:50 PM": false,
        }),
        createTestAssistantPreferences({
          First: "Alex",
          Last: "Bregman",
          Email: "abregman@wpi.edu",
          "M-T-R-F | 10:00 AM - 10:50 AM": true,
          "T-F | 3:00 PM - 4:50 PM": true,
        }),
      ];

      const meetingMap = makeMeetingToAssistantMap(preferences);

      const morning = meetingMap["M-T-R-F | 10:00 AM - 10:50 AM"] || [];
      const afternoon = meetingMap["T-F | 3:00 PM - 4:50 PM"] || [];

      expect(morning.map(personKey)).toContain("Wilyer Abreu");
      expect(morning.map(personKey)).toContain("Alex Bregman");
      expect(afternoon.map(personKey)).not.toContain("Wilyer Abreu");
      expect(afternoon.map(personKey)).toContain("Alex Bregman");
    });

    it("should ignore non-meeting fields", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Kristian",
          Last: "Campbell",
          Email: "kcampbell@wpi.edu",
          "CS 101": true, // Should be ignored
          "M-W-F | 9:00 AM - 9:50 AM": true,
        }),
      ];

      const meetingMap = makeMeetingToAssistantMap(preferences);

      expect(meetingMap["CS 101"]).toBeUndefined();
      expect(meetingMap["M-W-F | 9:00 AM - 9:50 AM"]).toBeDefined();
    });

    it("should handle empty preferences", () => {
      const meetingMap = makeMeetingToAssistantMap([]);
      expect(Object.keys(meetingMap)).toHaveLength(0);
    });

    it("should only include meetings where value is true", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Brock",
          Last: "Holt",
          Email: "bholt@wpi.edu",
          "M-W-F | 9:00 AM - 9:50 AM": true,
          "T-R | 2:00 PM - 3:20 PM": false,
        }),
      ];

      const meetingMap = makeMeetingToAssistantMap(preferences);

      expect(meetingMap["M-W-F | 9:00 AM - 9:50 AM"]).toBeDefined();
      expect(meetingMap["T-R | 2:00 PM - 3:20 PM"]).toBeUndefined();
    });
  });

  describe("mergeAllocationsAndAssignments", () => {
    it("should merge allocations with assignments correctly", () => {
      const allocations: AllocationWithoutAssistants[] = [
        createTestAllocationWithoutAssistants({
          Section: "CS 101-A01",
        }),
        createTestAllocationWithoutAssistants({
          Section: "CS 202-B01",
        }),
      ];

      const assignments: Assignment[] = [
        createTestAssignment({
          Section: "CS 101-A01",
          TAs: "Abreu, Wilyer", // Will be parsed to proper format
          PLAs: "Bregman, Alex", // Will be parsed to proper format
          GLAs: [],
        }),
      ];

      const merged = mergeAllocationsAndAssignments(allocations, assignments);

      expect(merged).toHaveLength(2);
      expect(merged[0]!.TAs).toHaveLength(1);
      expect(merged[0]!.PLAs).toHaveLength(1);
      expect(merged[0]!.TAs[0]!.First).toBe("Wilyer");
      expect(merged[0]!.PLAs[0]!.First).toBe("Alex");

      // Second allocation should have empty arrays since no assignment
      expect(merged[1]!.TAs).toHaveLength(0);
      expect(merged[1]!.PLAs).toHaveLength(0);
      expect(merged[1]!.GLAs).toHaveLength(0);
    });

    it("should handle missing assignments gracefully", () => {
      const allocations: AllocationWithoutAssistants[] = [
        createTestAllocationWithoutAssistants({
          Section: "CS 101-A01",
        }),
      ];

      const assignments: Assignment[] = []; // No assignments

      const merged = mergeAllocationsAndAssignments(allocations, assignments);

      expect(merged).toHaveLength(1);
      expect(merged[0]!.TAs).toHaveLength(0);
      expect(merged[0]!.PLAs).toHaveLength(0);
      expect(merged[0]!.GLAs).toHaveLength(0);
    });

    it("should match assignments by section key correctly", () => {
      const allocations: AllocationWithoutAssistants[] = [
        createTestAllocationWithoutAssistants({
          Section: "CS 101-A01",
        }),
        createTestAllocationWithoutAssistants({
          Section: "CS 101-B01",
        }),
      ];

      const assignments: Assignment[] = [
        createTestAssignment({
          Section: "CS 101-B01", // Only B01 has assignment
          TAs: "Campbell, Kristian", // Will be parsed to proper format
        }),
      ];

      const merged = mergeAllocationsAndAssignments(allocations, assignments);

      expect(merged).toHaveLength(2);

      // First allocation (A01) should have no assignments
      expect(merged[0]!.TAs).toHaveLength(0);

      // Second allocation (B01) should have the assignment
      expect(merged[1]!.TAs).toHaveLength(1);
      expect(merged[1]!.TAs[0]!.First).toBe("Kristian");
    });

    it("should handle empty allocations", () => {
      const merged = mergeAllocationsAndAssignments([], []);
      expect(merged).toHaveLength(0);
    });

    it("should preserve allocation properties", () => {
      const allocations: AllocationWithoutAssistants[] = [
        createTestAllocationWithoutAssistants({
          Section: "CS 101-A01",
          "Academic Period": "Spring 2025",
          Enrollment: 42,
          "Section Cap": 50,
        }),
      ];

      const assignments: Assignment[] = [
        createTestAssignment({
          Section: "CS 101-A01",
          TAs: "Anthony, Roman",
        }),
      ];

      const merged = mergeAllocationsAndAssignments(allocations, assignments);

      expect(merged[0]!["Academic Period"]).toBe("Spring 2025");
      expect(merged[0]!.Enrollment).toBe(42);
      expect(merged[0]!["Section Cap"]).toBe(50);
      expect(merged[0]!.TAs).toHaveLength(1);
    });

    it("should handle multiple assistants per type", () => {
      const allocations: AllocationWithoutAssistants[] = [
        createTestAllocationWithoutAssistants({
          Section: "CS 3043-A01",
        }),
      ];

      const assignments: Assignment[] = [
        createTestAssignment({
          Section: "CS 3043-A01",
          TAs: "Anthony, Roman; Mayer, Marcelo",
          PLAs: "Abreu, Wilyer; Bregman, Alex; Campbell, Kristian",
          GLAs: "Holt, Brock",
        }),
      ];

      const merged = mergeAllocationsAndAssignments(allocations, assignments);

      expect(merged[0]!.TAs).toHaveLength(2);
      expect(merged[0]!.PLAs).toHaveLength(3);
      expect(merged[0]!.GLAs).toHaveLength(1);
    });

    it("should handle duplicate section keys", () => {
      // This tests edge case where same section appears twice
      const allocations: AllocationWithoutAssistants[] = [
        createTestAllocationWithoutAssistants({
          Section: "CS 101-A01",
          Enrollment: 30,
        }),
        createTestAllocationWithoutAssistants({
          Section: "CS 101-A01", // Duplicate
          Enrollment: 25,
        }),
      ];

      const assignments: Assignment[] = [
        createTestAssignment({
          Section: "CS 101-A01",
          TAs: "Whitlock, Garrett",
        }),
      ];

      const merged = mergeAllocationsAndAssignments(allocations, assignments);

      expect(merged).toHaveLength(2);
      // Both should get the same assignment since they have the same section key
      expect(merged[0]!.TAs).toHaveLength(1);
      expect(merged[1]!.TAs).toHaveLength(1);
      // But they should preserve their different enrollment numbers
      expect(merged[0]!.Enrollment).toBe(30);
      expect(merged[1]!.Enrollment).toBe(25);
    });
  });
});
