import { makeCourseToAssistantMap, personKey } from "@/lib/validation";
import {
  ensureCourseNeedsAreMet,
  ensureAssignedAssistantsAreQualified,
  ensureAssignedTAsAndPLAsAreAvailable,
  ensureAssistantsAreAssignedToOnlyOneClass,
  ensureAllAvailableAssistantsAreAssigned,
} from "@/lib/validation-functions";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  ValidationInputSchema
} from "@/types/excel";

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
      const courseToAssistantsPla = makeCourseToAssistantMap(input["PLA Preferences"]);
      const courseToAssistantsTa = makeCourseToAssistantMap(input["TA Preferences"]);

      // Convert to Sets for the validation function
      const courseToAssistantsPlaSet: Record<string, Set<string>> = {};
      const courseToAssistantsTaSet: Record<string, Set<string>> = {};

      for (const [course, assistants] of Object.entries(courseToAssistantsPla)) {
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
        ],
      };
    }),
});