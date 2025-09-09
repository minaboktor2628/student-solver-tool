import type { Allocation, Assignment } from "./excel";

export type ValidationStepResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export type AllocationWithAssignment = Allocation & Assignment; // used to merge the two later
