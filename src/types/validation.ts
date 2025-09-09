import type { Allocation, Assignment } from "./excel";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  meta: {
    ms: number;
    rule: string;
  };
};

export type AllocationWithAssignment = Allocation & Assignment; // used to merge the two later
