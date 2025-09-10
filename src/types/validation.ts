export type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  meta: {
    ms: number;
    rule: string;
  };
};
