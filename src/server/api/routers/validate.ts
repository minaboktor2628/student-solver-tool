import { makeCourseToAssistantMap, personKey } from "@/lib/validation";
import {
  ensureCourseNeedsAreMet,
  ensureAssignedAssistantsAreQualified,
  ensureAssignedTAsAndPLAsAreAvailable,
  ensureAssistantsAreAssignedToOnlyOneClass,
} from "@/lib/validation-functions";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { ValidationInputSchema, type Allocation } from "@/types/excel";
import type { ValidationResult } from "@/types/validation";

export const validateRoute = createTRPCRouter({
  validateFullSolution: publicProcedure
    .input(ValidationInputSchema)
    .mutation(async ({ input }) => {
      const plaAvailableSet = new Set(
        input["PLA Preferences"].filter((a) => a.Available).map(personKey),
      );

      const taAvailableSet = new Set(
        input["TA Preferences"].filter((a) => a.Available).map(personKey),
      );

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
            makeCourseToAssistantMap(input["PLA Preferences"]),
            makeCourseToAssistantMap(input["TA Preferences"]),
          ),
          ensureCourseNeedsAreMet(input.Allocations),
          ensureAllAvailableAssistantsAreAssigned(
            input.Allocations,
            plaAvailableSet,
            taAvailableSet,
          ),
        ],
      };
    }),
});

/**
 * Ensure all available assistants are assigned at least once.
 * - PLA: warning if not assigned
 * - TA: error if not assigned
 */
function ensureAllAvailableAssistantsAreAssigned(
  assignments: Allocation[],
  plaAvailableSet: Set<string>,
  taAvailableSet: Set<string>,
): ValidationResult {
  const t0 = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  const assignedPLAs = new Set<string>();
  const assignedTAs = new Set<string>();

  for (const assignment of assignments) {
    for (const pla of assignment.PLAs) {
      assignedPLAs.add(personKey(pla));
    }
    for (const ta of assignment.TAs) {
      assignedTAs.add(personKey(ta));
    }
  }

  for (const pla of plaAvailableSet) {
    if (!assignedPLAs.has(pla)) {
      warnings.push(
        `PLA "${pla}" is available but not assigned to any course.`,
      );
    }
  }

  for (const ta of taAvailableSet) {
    if (!assignedTAs.has(ta)) {
      errors.push(`TA "${ta}" is available but not assigned to any course.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    meta: {
      ms: Math.round(performance.now() - t0),
      rule: "All available assistants should be assigned at least once.",
    },
  };
}
