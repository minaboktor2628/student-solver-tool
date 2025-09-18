import {
  makeCourseToAssistantMap,
  personKey,
  sectionKey,
} from "@/lib/validation";
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
      return {
        issues: [
          ensureAssistantsAreAssignedToOnlyOneClass(input.Allocations),
          ensureAssignedTAsAndPLAsAreAvailable(
            input.Allocations,
            input["PLA Preferences"],
            input["TA Preferences"],
          ),
          ensureAssignedAssistantsAreQualified(
            input.Allocations,
            input["PLA Preferences"],
            input["TA Preferences"],
          ),
          ensureCourseNeedsAreMet(input.Allocations),
        ],
      };
    }),
});

function ensureCourseNeedsAreMet(assignments: Allocation[]): ValidationResult {
  const t0 = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  const sumHours = (xs: { Hours: number }[]) =>
    xs.reduce((acc, x) => acc + x.Hours, 0);

  for (const assignment of assignments) {
    const course = sectionKey(assignment.Section);
    const {
      Calculated: hoursNeeded,
      MOEOver,
      MOEShort,
    } = assignment["Student Hour Allocation"];

    const assistantHoursAssigned =
      sumHours(assignment.PLAs) +
      sumHours(assignment.GLAs) +
      sumHours(assignment.TAs);

    const diff = assistantHoursAssigned - hoursNeeded; // positive = extra, negative = short

    // Too few hours
    if (diff < 0) {
      if (Math.abs(diff) > MOEShort) {
        errors.push(
          `${course}: short by ${Math.abs(diff)}h (needed ${hoursNeeded}h, assigned ${assistantHoursAssigned}h; exceeds MOE ${MOEShort}h).`,
        );
      } else {
        warnings.push(
          `${course}: short by ${Math.abs(diff)}h but within MOE ${MOEShort}h (needed ${hoursNeeded}h, assigned ${assistantHoursAssigned}h).`,
        );
      }
      continue; // no need to also check the overage branch
    }

    // Too many hours
    if (diff > 0) {
      if (diff > MOEOver) {
        warnings.push(
          `${course}: over by ${diff}h (needed ${hoursNeeded}h, assigned ${assistantHoursAssigned}h; exceeds MOE ${MOEOver}h).`,
        );
      } else {
        // within MOE
        warnings.push(
          `${course}: over by ${diff}h but within MOE ${MOEOver}h (needed ${hoursNeeded}h, assigned ${assistantHoursAssigned}h).`,
        );
      }
    }

    // If diff === 0, perfect match so no message
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    meta: {
      ms: Math.round(performance.now() - t0),
      rule: "Courses should have sufficient staffing.",
    },
  };
}

function ensureAssignedAssistantsAreQualified(
  assignments: Allocation[],
  plaPreferences: AssistantPreferences[],
  taPreferences: AssistantPreferences[],
): ValidationResult {
  const t0 = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  const courseToTas = makeCourseToAssistantMap(taPreferences);
  const courseToPlas = makeCourseToAssistantMap(plaPreferences);

  for (const assignment of assignments) {
    const courseKey = assignment.Section.Course;

    const tas = courseToTas[courseKey];
    if (!tas) {
      continue;
    }

    for (const ta of assignment.TAs ?? []) {
      const id = personKey(ta);
      const qualified = tas.some((p) => personKey(p) === id);
      if (!qualified) {
        errors.push(`TA "${id}" is not qualified for ${courseKey}.`);
      }
    }
  }

  for (const assignment of assignments) {
    const courseKey = assignment.Section.Course;

    const plas = courseToPlas[courseKey];
    if (!plas) {
      continue;
    }

    for (const pla of assignment.PLAs ?? []) {
      const id = personKey(pla);
      const qualified = plas.some((p) => personKey(p) === id);
      if (!qualified) {
        errors.push(`PLA "${id}" is not qualified for ${courseKey}.`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    meta: {
      ms: Math.round(performance.now() - t0),
      rule: "Assistants should only be assigned to courses that they are qualified for.",
    },
  };
}

function ensureAssignedTAsAndPLAsAreAvailable(
  assignments: Allocation[],
  plaPreferences: AssistantPreferences[],
  taPreferences: AssistantPreferences[],
): ValidationResult {
  const t0 = performance.now();
  const errors: string[] = [];

  const plaAvailableSet = new Set(
    plaPreferences.filter((a) => a.Available).map(personKey),
  );

  const taAvailableSet = new Set(
    taPreferences.filter((a) => a.Available).map(personKey),
  );

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

  return {
    ok: errors.length === 0,
    errors,
    warnings: [],
    meta: {
      ms: Math.round(performance.now() - t0),
      rule: "Assigned assistant exists and is available for this term.",
    },
  };
}

function ensureAssistantsAreAssignedToOnlyOneClass(
  assignments: Allocation[],
): ValidationResult {
  const t0 = performance.now();
  const plaSet = new Set();
  const taSet = new Set();
  const glaSet = new Set();

  const errors: string[] = [];
  const warnings: string[] = [];

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
        warnings.push(`GLA "${fullName}" is duplicated in ${courseFullName}.`);
      else glaSet.add(fullName);
    }

    for (const ta of assignment.TAs) {
      const fullName = personKey(ta);
      if (taSet.has(fullName))
        errors.push(`TA "${fullName}" is duplicated in ${courseFullName}.`);
      else taSet.add(fullName);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    meta: {
      ms: Math.round(performance.now() - t0),
      rule: "Assistant is assigned to only one class.",
    },
  };
}
