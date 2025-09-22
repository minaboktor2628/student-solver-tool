// __tests__/validation.test.ts
import { describe, it, expect } from "vitest";
import {
  mergeAllocationsAndAssignments,
  makeCourseToAssistantMap,
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
  Allocation,
} from "@/types/excel";

// Test data factories using Zod parsing to ensure correct types
function createTestAssistantPreferences(
  overrides: Record<string, any> = {},
): AssistantPreferences {
  const baseData = {
    First: "John",
    Last: "Doe",
    Email: "jdoe@wpi.edu",
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
  });

  describe("personKey", () => {
    it("should create a person key from first and last name", () => {
      const person = { First: "John", Last: "Doe" };
      expect(personKey(person)).toBe("John Doe");
    });

    it("should handle names with spaces and hyphens", () => {
      const person = { First: "Mary Jane", Last: "Smith-Wilson" };
      expect(personKey(person)).toBe("Mary Jane Smith-Wilson");
    });

    it("should handle empty names gracefully", () => {
      const person = { First: "", Last: "Doe" };
      expect(personKey(person)).toBe(" Doe");
    });
  });

  describe("makeCourseToAssistantMap", () => {
    it("should map courses to qualified assistants", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Alice",
          Last: "Johnson",
          Email: "ajohnson@wpi.edu",
          "CS 101": true,
          "CS 202": false,
        }),
        createTestAssistantPreferences({
          First: "Bob",
          Last: "Smith",
          Email: "bsmith@wpi.edu",
          "CS 101": true,
          "CS 303": true,
        }),
        createTestAssistantPreferences({
          First: "Carol",
          Last: "Davis",
          Email: "cdavis@wpi.edu",
          Available: false,
          "CS 202": true,
        }),
      ];

      const courseMap = makeCourseToAssistantMap(preferences);

      // Check that the correct assistants are mapped to CS 101
      const cs101Assistants = courseMap["CS 101"] || [];
      const cs101Names = cs101Assistants.map(personKey);
      
      expect(cs101Names).toContain("Alice Johnson");
      expect(cs101Names).toContain("Bob Smith");
      expect(cs101Names).not.toContain("Carol Davis");

      // Check CS 303
      const cs303Assistants = courseMap["CS 303"] || [];
      const cs303Names = cs303Assistants.map(personKey);
      
      expect(cs303Names).toContain("Bob Smith");
      expect(cs303Names).not.toContain("Alice Johnson");

      // Check CS 202 (Carol should be included regardless of Available status)
      const cs202Assistants = courseMap["CS 202"] || [];
      const cs202Names = cs202Assistants.map(personKey);
      
      expect(cs202Names).toContain("Carol Davis");
    });

    it("should ignore non-course fields", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Dave",
          Last: "Wilson",
          Email: "dwilson@wpi.edu",
          "CS 101": true,
          Available: true, // This should be ignored
          Comments: null, // This should be ignored
        }),
      ];

      const courseMap = makeCourseToAssistantMap(preferences);

      // Check that Dave is mapped to CS 101
      const cs101Assistants = courseMap["CS 101"] || [];
      const cs101Names = cs101Assistants.map(personKey);
      
      expect(cs101Names).toContain("Dave Wilson");
      
      // Check that non-course fields are not in the map
      expect(courseMap["Available"]).toBeUndefined();
      expect(courseMap["Comments"]).toBeUndefined();
      expect(courseMap["Email"]).toBeUndefined();
    });

    it("should only include courses that match CS pattern", () => {
      const preferences: AssistantPreferences[] = [
        createTestAssistantPreferences({
          First: "Eve",
          Last: "Brown",
          Email: "ebrown@wpi.edu",
          "CS 101": true, // Should be included
          "CS 1234": true, // Should be included
        }),
      ];

      const courseMap = makeCourseToAssistantMap(preferences);

      expect(courseMap["CS 101"]).toBeDefined();
      expect(courseMap["CS 1234"]).toBeDefined();
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
          TAs: "Johnson, Alice", // Will be parsed to proper format
          PLAs: "Smith, Bob", // Will be parsed to proper format
          GLAs: [],
        }),
      ];

      const merged = mergeAllocationsAndAssignments(allocations, assignments);

      expect(merged).toHaveLength(2);
      expect(merged[0]!.TAs).toHaveLength(1);
      expect(merged[0]!.PLAs).toHaveLength(1);
      expect(merged[0]!.TAs[0]!.First).toBe("Alice");
      expect(merged[0]!.PLAs[0]!.First).toBe("Bob");

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
          TAs: "Brown, Charlie", // Will be parsed to proper format
        }),
      ];

      const merged = mergeAllocationsAndAssignments(allocations, assignments);

      expect(merged).toHaveLength(2);

      // First allocation (A01) should have no assignments
      expect(merged[0]!.TAs).toHaveLength(0);

      // Second allocation (B01) should have the assignment
      expect(merged[1]!.TAs).toHaveLength(1);
      expect(merged[1]!.TAs[0]!.First).toBe("Charlie");
    });
  });
});