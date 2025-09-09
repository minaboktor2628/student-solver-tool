import {
  makeCourseToAssistantMap,
  mergeAllocationsAndAssignments,
  personKey,
  sectionKey,
} from "@/lib/validation";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { ValidationInputSchema } from "@/types/excel";
import type {
  AllocationWithAssignment,
  ValidationStepResult,
} from "@/types/validation";

export const validateRoute = createTRPCRouter({
  validateFullSolution: publicProcedure
    .input(ValidationInputSchema)
    .mutation(async ({ input }) => {
      const allocationWithAssignment = mergeAllocationsAndAssignments(
        input.Allocations,
        input.Assignments,
      );

      const plaAvailableSet = new Set(
        input["PLA Preferences"].filter((a) => a.Available).map(personKey),
      );

      const taAvailableSet = new Set(
        input["TA Preferences"].filter((a) => a.Available).map(personKey),
      );

      return {
        duplicated: ensureAssistantsAreAssignedToOnlyOneClass(
          allocationWithAssignment,
        ),
        assistantsExist: ensureAssignedTAsAndPLAsAreAvailable(
          allocationWithAssignment,
          plaAvailableSet,
          taAvailableSet,
        ),
        assistantsQualified: ensureAssignedAssistantsAreQualified(
          allocationWithAssignment,
          makeCourseToAssistantMap(input["PLA Preferences"]),
          makeCourseToAssistantMap(input["TA Preferences"]),
        ),
      };
    }),
});

function ensureAssignedAssistantsAreQualified(
  assignments: AllocationWithAssignment[],
  courseToAssistantsPla: Record<string, Set<string>>,
  courseToAssistantsTa: Record<string, Set<string>>,
): ValidationStepResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const assignment of assignments) {
    const key = assignment.Section.Course;

    const taSet = courseToAssistantsTa[key];
    if (!taSet) {
      warnings.push(`No qualified TAs listed for section ${key}.`);
      continue;
    }

    const plaSet = courseToAssistantsPla[key];
    if (!plaSet) {
      warnings.push(`No qualified PLAs listed for section ${key}.`);
      continue;
    }

    for (const ta of assignment.TAs) {
      const id = personKey(ta);
      if (!taSet.has(id)) {
        errors.push(`TA "${id}" is not qualified for ${key}.`);
      }
    }

    for (const pla of assignment.PLAs) {
      const id = personKey(pla);
      if (!plaSet.has(id)) {
        errors.push(`PLA "${id}" is not qualified for ${key}.`);
      }
    }
  }
  return { isValid: errors.length === 0, errors, warnings };
}

function ensureAssignedTAsAndPLAsAreAvailable(
  assignments: AllocationWithAssignment[],
  plaAvailableSet: Set<string>,
  taAvailableSet: Set<string>,
): ValidationStepResult {
  const errors: string[] = [];

  for (const assignment of assignments) {
    const courseFullName = sectionKey(assignment.Section);

    for (const pla of assignment.PLAs) {
      const fullName = personKey(pla);
      if (!plaAvailableSet.has(fullName)) {
        errors.push(
          `PLA "${fullName}" assigned to ${courseFullName} does not exist in PLA preferences or is unavailable for this term.`,
        );
      }
    }

    for (const ta of assignment.TAs) {
      const fullName = personKey(ta);
      if (!taAvailableSet.has(fullName)) {
        errors.push(
          `TA "${fullName}" assigned to ${courseFullName} does not exist in TA preferences.`, // TAs should always be available
        );
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

function ensureAssistantsAreAssignedToOnlyOneClass(
  assignments: AllocationWithAssignment[],
): ValidationStepResult {
  const plaSet = new Set();
  const taSet = new Set();
  const glaSet = new Set();

  const errors: string[] = [];

  for (const assignment of assignments) {
    const courseFullName = sectionKey(assignment.Section);

    for (const pla of assignment.PLAs) {
      const fullName = personKey(pla);
      if (plaSet.has(fullName))
        errors.push(`PLAs: ${fullName} is duplicated in ${courseFullName}.`);
      else plaSet.add(fullName);
    }

    for (const gla of assignment.GLAs) {
      const fullName = personKey(gla);
      if (glaSet.has(fullName))
        errors.push(`GLAs: ${fullName} is duplicated in ${courseFullName}.`);
      else glaSet.add(fullName);
    }

    for (const ta of assignment.TAs) {
      const fullName = personKey(ta);
      if (taSet.has(fullName))
        errors.push(`TAs: ${fullName} is duplicated in ${courseFullName}.`);
      else taSet.add(fullName);
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}
