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
        allocationWithAssignment,
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
        courseNeedsMet: ensureCourseNeedsAreMet(allocationWithAssignment),
      };
    }),
});

function ensureCourseNeedsAreMet(
  assignments: AllocationWithAssignment[],
): ValidationStepResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const sumHours = (xs: { Hours: number }[]) =>
    xs.reduce((acc, x) => acc + x.Hours, 0);

  for (const assignment of assignments) {
    const course = assignment.Section.Course;
    const { Calculated: hoursNeeded, MOE } =
      assignment["Student Hour Allocation"];

    const assistantHoursAssigned =
      sumHours(assignment.PLAs) +
      sumHours(assignment.GLAs) +
      sumHours(assignment.TAs);

    const diff = assistantHoursAssigned - hoursNeeded; // positive = extra, negative = short

    // Too few hours
    if (diff < 0) {
      if (Math.abs(diff) > MOE) {
        errors.push(
          `${course}: short by ${Math.abs(diff)}h (needed ${hoursNeeded}h, assigned ${assistantHoursAssigned}h; exceeds MOE ${MOE}h).`,
        );
      } else {
        warnings.push(
          `${course}: short by ${Math.abs(diff)}h but within MOE ${MOE}h (needed ${hoursNeeded}h, assigned ${assistantHoursAssigned}h).`,
        );
      }
      continue; // no need to also check the overage branch
    }

    // Too many hours
    if (diff > 0) {
      if (diff > MOE) {
        warnings.push(
          `${course}: over by ${diff}h (needed ${hoursNeeded}h, assigned ${assistantHoursAssigned}h; exceeds MOE ${MOE}h).`,
        );
      } else {
        // within MOE
        warnings.push(
          `${course}: over by ${diff}h but within MOE ${MOE}h (needed ${hoursNeeded}h, assigned ${assistantHoursAssigned}h).`,
        );
      }
    }

    // If diff === 0, perfect match so no message
  }

  return { isValid: errors.length === 0, errors, warnings };
}

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
        errors.push(`PLA "${fullName}" is duplicated in ${courseFullName}.`);
      else plaSet.add(fullName);
    }

    for (const gla of assignment.GLAs) {
      const fullName = personKey(gla);
      if (glaSet.has(fullName))
        errors.push(`GLA "${fullName}" is duplicated in ${courseFullName}.`);
      else glaSet.add(fullName);
    }

    for (const ta of assignment.TAs) {
      const fullName = personKey(ta);
      if (taSet.has(fullName))
        errors.push(`TA "${fullName}" is duplicated in ${courseFullName}.`);
      else taSet.add(fullName);
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}
