// validation router
import { makeMeetingToAssistantMap, personKey } from "@/lib/validation";
import {
  ensureCourseNeedsAreMet,
  ensureAssignedAssistantsAreQualified,
  ensureAssignedTAsAndPLAsAreAvailable,
  ensureAssistantsAreAssignedToOnlyOneClass,
  ensureAllAvailableAssistantsAreAssigned,
  ensureSocialImpsAvailability,
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
          ensureAllAvailableAssistantsAreAssigned(
            input.Allocations,
            input["PLA Preferences"],
            input["TA Preferences"],
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
