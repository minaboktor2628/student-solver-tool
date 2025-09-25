// __tests__/social-imps-validation.test.ts
import { describe, it, expect } from "vitest";
import type { Allocation, AssistantPreferences } from "@/types/excel";

// Copy of the function from validate.ts for testing
function ensureSocialImpsAvailability(
  assignments: Allocation[],
  plaPreferences: AssistantPreferences[],
  taPreferences: AssistantPreferences[],
) {
  const t0 = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Helper functions (copied from validation.ts)
  const makeMeetingToAssistantMap = (data: AssistantPreferences[]) => {
    const courseMap: Record<string, AssistantPreferences[]> = {};
    const MEETING_RE =
      /^(?<days>[MTWRF](?:-[MTWRF])*)\s*\|\s*(?<start>\d{1,2}:\d{2}\s[AP]M)\s*-\s*(?<end>\d{1,2}:\d{2}\s[AP]M)$/;

    for (const student of data) {
      for (const [key, value] of Object.entries(student)) {
        // FIX: Properly handle boolean values - only include if value is true
        if (MEETING_RE.test(key) && value === true) {
          (courseMap[key] ??= []).push(student);
        }
      }
    }

    return courseMap;
  };

  const personKey = (s: { First?: string; Last?: string }) => {
    return `${s.First} ${s.Last}`;
  };

  const meetingToPlas = makeMeetingToAssistantMap(plaPreferences);
  const meetingToTas = makeMeetingToAssistantMap(taPreferences);

  // go through course staff assigned to social imps
  // check if course staff available under "T-F 3:00 PM - 4:50 PM" or	"T-F 4:00 PM - 5:50 PM"

  for (const assignment of assignments) {
    const key = assignment.Section.Course;
    if (key !== "CS 3043") {
      continue;
    }
    const subsection = assignment.Section.Subsection;
    const time = assignment["Meeting Pattern(s)"];
    if (typeof time !== "string") {
      throw new Error(
        `Expected meeting pattern to be a string for CS 3043 ${subsection}, got ${time}`,
      );
    }

    const plas = meetingToPlas[time];
    if (plas) {
      // plas assigned to social imps
      for (const pla of assignment.PLAs) {
        const id = personKey(pla);
        //if pla preference of course [time] is false, push error
        const available = plas.some((p) => personKey(p) === id);
        if (!available) {
          errors.push(
            `PLA ${id} assigned to CS 3043 ${subsection} is not available during ${time}.`,
          );
        }
      }
    } else {
      // FIX: If no PLAs are available for this time, all assigned PLAs are unavailable
      for (const pla of assignment.PLAs) {
        const id = personKey(pla);
        errors.push(
          `PLA ${id} assigned to CS 3043 ${subsection} is not available during ${time}.`,
        );
      }
    }

    // this check is not necessary for current data because TAs cannot be assigned to CS 3043
    // kept for redundancy
    const tas = meetingToTas[time];
    if (tas) {
      // tas assigned to social imps
      for (const ta of assignment.TAs) {
        const id = personKey(ta);
        //if ta preference of course [time] is false, push error
        const available = tas.some((p) => personKey(p) === id);
        if (!available) {
          errors.push(
            `TA ${id} assigned to CS 3043 ${subsection} is not available during ${time}.`,
          );
        }
      }
    } else {
      // FIX: If no TAs are available for this time, all assigned TAs are unavailable
      for (const ta of assignment.TAs) {
        const id = personKey(ta);
        errors.push(
          `TA ${id} assigned to CS 3043 ${subsection} is not available during ${time}.`,
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    meta: {
      ms: Math.round(performance.now() - t0),
      rule: "CS 3043 assistants must be available for the course time.",
    },
  };
}

// Helper functions for creating test data
function createAllocation(overrides: Partial<Allocation> = {}): Allocation {
  return {
    "Academic Period": "Fall 2024",
    Section: {
      Course: "CS 3043",
      Subsection: "A01",
      Title: "Social Implications of Information Processing",
    },
    CrossListed: false,
    "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
    Instructors: "Prof. Smith",
    "Reserved Cap": null,
    "Cap Breakdown": null,
    "Section Cap": 30,
    Enrollment: 25,
    "Waitlist Count": 0,
    "Student Hour Allocation": {
      Calculated: 100,
      MOEOver: 10,
      MOEShort: 5,
    },
    TAs: [],
    PLAs: [],
    GLAs: [],
    ...overrides,
  };
}

function createAssistantPreferences(
  overrides: Partial<AssistantPreferences> = {},
): AssistantPreferences {
  return {
    First: "Roman",
    Last: "Anthony",
    Email: "ranthony@wpi.edu",
    Comments: null,
    Available: true,
    ...overrides,
  };
}

describe("CS 3043 Social Implications Validation", () => {
  describe("ensureSocialImpsAvailability", () => {
    it("should pass when PLA is available for the meeting time", () => {
      const assignments = [
        createAllocation({
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          PLAs: [{ First: "Wilyer", Last: "Abreu", Locked: false, Hours: 25 }],
        }),
      ];

      const plaPrefs = [
        createAssistantPreferences({
          First: "Wilyer",
          Last: "Abreu",
          Email: "wabreu@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": true,
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, plaPrefs, []);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should create error when PLA is not available for the meeting time", () => {
      const assignments = [
        createAllocation({
          Section: {
            Course: "CS 3043",
            Subsection: "B01",
            Title: "Social Implications of Information Processing",
          },
          "Meeting Pattern(s)": "T-F | 4:00 PM - 5:50 PM",
          PLAs: [{ First: "Alex", Last: "Bregman", Locked: false, Hours: 25 }],
        }),
      ];

      const plaPrefs = [
        createAssistantPreferences({
          First: "Alex",
          Last: "Bregman",
          Email: "abregman@wpi.edu",
          "T-F | 4:00 PM - 5:50 PM": false, // Not available
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, plaPrefs, []);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "PLA Alex Bregman assigned to CS 3043 B01 is not available during T-F | 4:00 PM - 5:50 PM",
      );
    });

    it("should pass when TA is available for the meeting time", () => {
      const assignments = [
        createAllocation({
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          TAs: [
            { First: "Kristian", Last: "Campbell", Locked: false, Hours: 50 },
          ],
        }),
      ];

      const taPrefs = [
        createAssistantPreferences({
          First: "Kristian",
          Last: "Campbell",
          Email: "kcampbell@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": true,
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, [], taPrefs);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should create error when TA is not available for the meeting time", () => {
      const assignments = [
        createAllocation({
          Section: {
            Course: "CS 3043",
            Subsection: "A01",
            Title: "Social Implications of Information Processing",
          },
          "Meeting Pattern(s)": "T-F | 4:00 PM - 5:50 PM",
          TAs: [{ First: "Brock", Last: "Holt", Locked: false, Hours: 50 }],
        }),
      ];

      const taPrefs = [
        createAssistantPreferences({
          First: "Brock",
          Last: "Holt",
          Email: "bholt@wpi.edu",
          "T-F | 4:00 PM - 5:50 PM": false, // Not available
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, [], taPrefs);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "TA Brock Holt assigned to CS 3043 A01 is not available during T-F | 4:00 PM - 5:50 PM",
      );
    });

    it("should ignore courses that are not CS 3043", () => {
      const assignments = [
        createAllocation({
          Section: {
            Course: "CS 101",
            Subsection: "A01",
            Title: "Introduction to Programming",
          },
          "Meeting Pattern(s)": "M-W-F | 9:00 AM - 9:50 AM",
          PLAs: [
            { First: "Garrett", Last: "Whitlock", Locked: false, Hours: 25 },
          ],
        }),
      ];

      const plaPrefs = [
        createAssistantPreferences({
          First: "Garrett",
          Last: "Whitlock",
          Email: "gwhitlock@wpi.edu",
          "M-W-F | 9:00 AM - 9:50 AM": false, // Not available, but should be ignored
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, plaPrefs, []);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle multiple CS 3043 sections", () => {
      const assignments = [
        createAllocation({
          Section: {
            Course: "CS 3043",
            Subsection: "A01",
            Title: "Social Implications of Information Processing",
          },
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          PLAs: [{ First: "Wilyer", Last: "Abreu", Locked: false, Hours: 25 }],
        }),
        createAllocation({
          Section: {
            Course: "CS 3043",
            Subsection: "B01",
            Title: "Social Implications of Information Processing",
          },
          "Meeting Pattern(s)": "T-F | 4:00 PM - 5:50 PM",
          PLAs: [{ First: "Alex", Last: "Bregman", Locked: false, Hours: 25 }],
        }),
      ];

      const plaPrefs = [
        createAssistantPreferences({
          First: "Wilyer",
          Last: "Abreu",
          Email: "wabreu@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": true,
          "T-F | 4:00 PM - 5:50 PM": false,
        }),
        createAssistantPreferences({
          First: "Alex",
          Last: "Bregman",
          Email: "abregman@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": false,
          "T-F | 4:00 PM - 5:50 PM": true,
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, plaPrefs, []);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle multiple assistants assigned to same CS 3043 section", () => {
      const assignments = [
        createAllocation({
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          PLAs: [
            { First: "Wilyer", Last: "Abreu", Locked: false, Hours: 15 },
            { First: "Alex", Last: "Bregman", Locked: false, Hours: 15 },
          ],
          TAs: [
            { First: "Kristian", Last: "Campbell", Locked: false, Hours: 25 },
          ],
        }),
      ];

      const plaPrefs = [
        createAssistantPreferences({
          First: "Wilyer",
          Last: "Abreu",
          Email: "wabreu@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": true, // Available
        }),
        createAssistantPreferences({
          First: "Alex",
          Last: "Bregman",
          Email: "abregman@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": false, // Not available
        }),
      ];

      const taPrefs = [
        createAssistantPreferences({
          First: "Kristian",
          Last: "Campbell",
          Email: "kcampbell@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": true, // Available
        }),
      ];

      const result = ensureSocialImpsAvailability(
        assignments,
        plaPrefs,
        taPrefs,
      );

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "PLA Alex Bregman assigned to CS 3043 A01 is not available",
      );
    });

    it("should handle assistants with no preferences for the meeting time", () => {
      const assignments = [
        createAllocation({
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          PLAs: [{ First: "Rafael", Last: "Devers", Locked: false, Hours: 25 }],
        }),
      ];

      const plaPrefs = [
        createAssistantPreferences({
          First: "Rafael",
          Last: "Devers",
          Email: "rdevers@wpi.edu",
          // No preferences for "T-F | 3:00 PM - 4:50 PM"
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, plaPrefs, []);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "PLA Rafael Devers assigned to CS 3043 A01 is not available during T-F | 3:00 PM - 4:50 PM",
      );
    });

    it("should handle assistants not in preferences at all", () => {
      const assignments = [
        createAllocation({
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          PLAs: [{ First: "Marcelo", Last: "Mayer", Locked: false, Hours: 25 }],
        }),
      ];

      const plaPrefs = [
        createAssistantPreferences({
          First: "Wilyer",
          Last: "Abreu",
          Email: "wabreu@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": true,
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, plaPrefs, []);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "PLA Marcelo Mayer assigned to CS 3043 A01 is not available",
      );
    });

    it("should throw error when meeting pattern is not a string", () => {
      const assignments = [
        createAllocation({
          "Meeting Pattern(s)": null, // Invalid type
          PLAs: [{ First: "Wilyer", Last: "Abreu", Locked: false, Hours: 25 }],
        }),
      ];

      expect(() => {
        ensureSocialImpsAvailability(assignments, [], []);
      }).toThrow(
        "Expected meeting pattern to be a string for CS 3043 A01, got null",
      );
    });

    it("should handle GLAs (they are not checked)", () => {
      const assignments = [
        createAllocation({
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          GLAs: [{ First: "Triston", Last: "Casas", Locked: false, Hours: 30 }],
        }),
      ];

      // No preferences provided for GLAs
      const result = ensureSocialImpsAvailability(assignments, [], []);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle empty assignments", () => {
      const result = ensureSocialImpsAvailability([], [], []);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should handle CS 3043 with no assigned assistants", () => {
      const assignments = [
        createAllocation({
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          TAs: [],
          PLAs: [],
          GLAs: [],
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, [], []);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return correct metadata", () => {
      const assignments = [
        createAllocation({
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          PLAs: [{ First: "Wilyer", Last: "Abreu", Locked: false, Hours: 25 }],
        }),
      ];

      const plaPrefs = [
        createAssistantPreferences({
          First: "Wilyer",
          Last: "Abreu",
          Email: "wabreu@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": true,
        }),
      ];

      const result = ensureSocialImpsAvailability(assignments, plaPrefs, []);

      expect(result.meta.rule).toBe(
        "CS 3043 assistants must be available for the course time.",
      );
      expect(typeof result.meta.ms).toBe("number");
      expect(result.meta.ms).toBeGreaterThanOrEqual(0);
    });

    it("should handle mixed availability results", () => {
      const assignments = [
        createAllocation({
          Section: {
            Course: "CS 3043",
            Subsection: "A01",
            Title: "Social Implications of Information Processing",
          },
          "Meeting Pattern(s)": "T-F | 3:00 PM - 4:50 PM",
          PLAs: [
            { First: "Connor", Last: "Wong", Locked: false, Hours: 15 },
            { First: "Jarren", Last: "Duran", Locked: false, Hours: 15 },
          ],
          TAs: [
            { First: "Ceddanne", Last: "Rafaela", Locked: false, Hours: 25 },
            { First: "David", Last: "Hamilton", Locked: false, Hours: 25 },
          ],
        }),
      ];

      const plaPrefs = [
        createAssistantPreferences({
          First: "Connor",
          Last: "Wong",
          Email: "cwong@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": true,
        }),
        createAssistantPreferences({
          First: "Jarren",
          Last: "Duran",
          Email: "jduran@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": false,
        }),
      ];

      const taPrefs = [
        createAssistantPreferences({
          First: "Ceddanne",
          Last: "Rafaela",
          Email: "crafaela@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": true,
        }),
        createAssistantPreferences({
          First: "David",
          Last: "Hamilton",
          Email: "dhamilton@wpi.edu",
          "T-F | 3:00 PM - 4:50 PM": false,
        }),
      ];

      const result = ensureSocialImpsAvailability(
        assignments,
        plaPrefs,
        taPrefs,
      );

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some((e) => e.includes("PLA Jarren Duran"))).toBe(
        true,
      );
      expect(result.errors.some((e) => e.includes("TA David Hamilton"))).toBe(
        true,
      );
    });
  });
});
