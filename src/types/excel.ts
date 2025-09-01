import { isExcelName, isExcelType } from "@/lib/utils";
import z from "zod";

// For backend validation
export const ExcelFileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, "File must not be empty.")
  .refine(
    (f) => isExcelType(f.type) || isExcelName(f.name),
    "File must be .xlsx or .xls",
  );

export const ExcelInputFiles = [
  "Assignments",
  "PLA Preferences",
  "TA Preferences",
] as const;
export type ExcelInputFileEnum = (typeof ExcelInputFiles)[number];

export const ExcelFileToJsonInputSchema = z.object(
  Object.fromEntries(
    ExcelInputFiles.map((key) => [key, ExcelFileSchema]),
  ) as Record<ExcelInputFileEnum, typeof ExcelFileSchema>,
);

// Accepted mime types
export const ACCEPT_MAP = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
};

// Coerce Y/N-ish, truthy/falsy strings, and null -> boolean
const yesNoBoolean = z.preprocess((val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s === "") return false;
    if (["y", "yes", "true", "t"].includes(s)) return true;
    if (["n", "no", "false", "f"].includes(s)) return false;
    // If it's some other string (e.g., stray whitespace), treat as false
    return false;
  }
  // Any other type: default to false
  return false;
}, z.boolean());

const numberOrNull = z.preprocess((val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    const trimmed = val.trim().toLowerCase();
    if (trimmed === "" || trimmed === "tbd" || trimmed === "n/a") return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }
  if (typeof val === "number") return val;
  return null;
}, z.number().nullable());

export const AllocationSchema = z.object({
  "Academic Period": z.string(),
  Section: z.string(),
  CrossListed: yesNoBoolean,
  "Meeting Pattern(s)": z.string().nullable(),
  Instructors: z.string().nullable(),
  "Reserved Cap": z.number().nullable(),
  "Cap Breakdown": z.string().nullable(),
  "Section Cap": z.number().nullable(),
  Enrollment: z.number(),
  "Waitlist Count": z.number(),
  "Student Hour Allocation": numberOrNull,
});

export const AssistantSchema = z.object({
  First: z.string(),
  Last: z.string(),
  Email: z
    .string()
    .email()
    .regex(/@wpi\.edu$/),
});

export type Assistant = z.infer<typeof AssistantSchema>;

const peoplePreprocessor = z.preprocess(
  (val) => {
    if (val === null) return [];
    if (typeof val !== "string") return [];

    // normalize whitespace (replace newlines/tabs/periods with comma)
    const normalized = val.replace(/[\n\t.]/g, ",");

    return normalized
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [last, first] = entry.split(",").map((s) => s.trim());
        return { First: first ?? "", Last: last ?? "", Locked: false };
      });
  },
  z.array(
    AssistantSchema.omit({ Email: true })
      .extend({ Locked: z.boolean() })
      .nullable(),
  ),
);

export const AssignmentSchema = AllocationSchema.omit({
  "Student Hour Allocation": true,
}).extend({
  TAs: peoplePreprocessor,
  PLAs: peoplePreprocessor,
  GLAs: peoplePreprocessor,
});

export type Allocation = z.infer<typeof AllocationSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;

export const AssistantPreferencesSchema = AssistantSchema.extend({
  Comments: z.string().nullable(),
  // Everything else (courses, "Available X Term?", time slots, etc.) becomes boolean
}).catchall(yesNoBoolean);
export type AssistantPreferences = z.infer<typeof AssistantPreferencesSchema>;

export const ExcelSheetNames = [
  "Allocations",
  "Assignments",
  "TAs",
  "PLAs",
  "GLAs",
  "PLA Preferences",
  "TA Preferences",
] as const;
export type ExcelSheetNameEnum = (typeof ExcelSheetNames)[number];

export const ExcelSheetSchema: Record<ExcelSheetNameEnum, z.ZodTypeAny> = {
  Allocations: AllocationSchema,
  Assignments: AssignmentSchema,
  TAs: AssistantSchema,
  PLAs: AssistantSchema,
  GLAs: AssistantSchema,
  "PLA Preferences": AssistantPreferencesSchema,
  "TA Preferences": AssistantPreferencesSchema,
};

export const ValidationArraySchemasBySheetName: Record<
  ExcelSheetNameEnum,
  z.ZodTypeAny
> = {
  Allocations: z.array(AllocationSchema).min(1),
  Assignments: z.array(AssignmentSchema).min(1),
  TAs: z.array(AssistantSchema).min(1),
  PLAs: z.array(AssistantSchema).min(1),
  GLAs: z.array(AssistantSchema).min(1),
  "PLA Preferences": z.array(AssistantPreferencesSchema).min(1),
  "TA Preferences": z.array(AssistantPreferencesSchema).min(1),
};

export const ValidationInputSchema = z.object(
  ValidationArraySchemasBySheetName,
);
