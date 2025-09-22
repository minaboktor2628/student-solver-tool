import {
  makeCourseToAssistantMap,
  makeMeetingToAssistantMap,
  personKey,
  sectionKey,
} from "@/lib/validation";
import {
  ensureCourseNeedsAreMet,
  ensureAssignedAssistantsAreQualified,
  ensureAssignedTAsAndPLAsAreAvailable,
  ensureAssistantsAreAssignedToOnlyOneClass,
  ensureAllAvailableAssistantsAreAssigned,
} from "@/lib/validation-functions";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  ValidationInputSchema,
  type Allocation,
  type AssistantPreferences,
} from "@/types/excel";
import type { ValidationResult } from "@/types/validation";

export const validateRoute = createTRPCRouter({
  validateFullSolution: publicProcedure
    .input(ValidationInputSchema)
    .mutation(async ({ input }) => {
      // Create sets of available assistants
      const plaAvailableSet = new Set(
        input["PLA Preferences"].filter((a) => a.Available).map(personKey),
      );

      const taAvailableSet = new Set(
        input["TA Preferences"].filter((a) => a.Available).map(personKey),
      );

      // Create course-to-assistant maps for qualification checking
      const courseToAssistantsPla = makeCourseToAssistantMap(
        input["PLA Preferences"],
      );
      const courseToAssistantsTa = makeCourseToAssistantMap(
        input["TA Preferences"],
      );

      // Convert to Sets for the validation function
      const courseToAssistantsPlaSet: Record<string, Set<string>> = {};
      const courseToAssistantsTaSet: Record<string, Set<string>> = {};

      for (const [course, assistants] of Object.entries(
        courseToAssistantsPla,
      )) {
        courseToAssistantsPlaSet[course] = new Set(assistants.map(personKey));
      }

      for (const [course, assistants] of Object.entries(courseToAssistantsTa)) {
        courseToAssistantsTaSet[course] = new Set(assistants.map(personKey));
      }

      return {
        issues: [
          ensureAssistantsAreAssignedToOnlyOneClass(input.Allocations),
          ensureAssignedTAsAndPLAsAreAvailable(
            input.Allocations,
            plaAvailableSet,
            taAvailableSet,
          ),
          ensureAssignedAssistantsAreQualified(
            input.Allocations,
            courseToAssistantsPlaSet,
            courseToAssistantsTaSet,
          ),
          ensureCourseNeedsAreMet(input.Allocations),
          ensureAllAvailableAssistantsAreAssigned(
            input.Allocations,
            plaAvailableSet,
            taAvailableSet,
          ),
          ensureSocialImpsAvailability(
            input.Allocations,
            input["PLA Preferences"],
            input["TA Preferences"],
          ),
        ],
      };
    }),
});

function ensureSocialImpsAvailability(
  assignments: Allocation[],
  plaPreferences: AssistantPreferences[],
  taPreferences: AssistantPreferences[],
): ValidationResult {
  const t0 = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

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
