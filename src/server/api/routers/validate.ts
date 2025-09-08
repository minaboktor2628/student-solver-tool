import { sectionKey } from "@/lib/validation";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { ValidationInputSchema, type Assignment } from "@/types/excel";
import type { ValidationStepResult } from "@/types/validation";

export const validateRoute = createTRPCRouter({
  validate: publicProcedure
    .input(ValidationInputSchema)
    .mutation(async ({ input }) => {
      const plaAvailableSet = new Set(
        input["PLA Preferences"]
          .filter((a) => a.Available)
          .map((a) => `${a.First} ${a.Last}`),
      );

      const taAvailableSet = new Set(
        input["TA Preferences"]
          .filter((a) => a.Available) // TAs should always be available
          .map((a) => `${a.First} ${a.Last}`),
      );

      return {
        input,
        duplicated: ensureAssistantsAreAssignedToOnlyOneClass(
          input.Assignments,
        ),
        allAssistantsExist: ensureAssignedTAsAndPLAsAreAvailable(
          input.Assignments,
          plaAvailableSet,
          taAvailableSet,
        ),
      };
    }),
});

function ensureAssignedTAsAndPLAsAreAvailable(
  assignments: Assignment[],
  plaAvailableSet: Set<string>,
  taAvailableSet: Set<string>,
): ValidationStepResult {
  const errors: string[] = [];

  for (const assignment of assignments) {
    const courseFullName = sectionKey(assignment.Section);

    for (const pla of assignment.PLAs) {
      const fullName = `${pla.First} ${pla.Last}`;
      if (!plaAvailableSet.has(fullName)) {
        errors.push(
          `PLA "${fullName}" assigned to ${courseFullName} does not exist in PLA preferences or is unavailable for this term.`,
        );
      }
    }

    for (const ta of assignment.TAs) {
      const fullName = `${ta.First} ${ta.Last}`;
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
  assignments: Assignment[],
): ValidationStepResult {
  const plaSet = new Set();
  const taSet = new Set();
  const glaSet = new Set();

  const errors: string[] = [];

  for (const assignment of assignments) {
    const courseFullName = sectionKey(assignment.Section);

    for (const pla of assignment.PLAs) {
      const fullName = pla.First + " " + pla.Last;
      if (plaSet.has(fullName))
        errors.push(`PLAs: ${fullName} is duplicated in ${courseFullName}.`);
      else plaSet.add(fullName);
    }

    for (const gla of assignment.GLAs) {
      const fullName = gla.First + " " + gla.Last;
      if (glaSet.has(fullName))
        errors.push(`GLAs: ${fullName} is duplicated in ${courseFullName}.`);
      else glaSet.add(fullName);
    }

    for (const ta of assignment.TAs) {
      const fullName = ta.First + " " + ta.Last;
      if (taSet.has(fullName))
        errors.push(`TAs: ${fullName} is duplicated in ${courseFullName}.`);
      else taSet.add(fullName);
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}
