// validation router
import {
  ensureCourseNeedsAreMet,
  ensureAssignedAssistantsAreQualified,
  ensureAssignedTAsAndPLAsAreAvailable,
  ensureAssistantsAreAssignedToOnlyOneClass,
  ensureAllAvailableAssistantsAreAssigned,
  ensureSocialImpsAvailability,
} from "@/lib/validation-functions";
import { coordinatorProcedure, createTRPCRouter } from "../trpc";
import { ValidationInputSchema } from "@/types/excel";

export const validateRoute = createTRPCRouter({
  validateFullSolution: coordinatorProcedure
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
