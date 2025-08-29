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

export const ExcelInputFiles = ["assignments", "pla", "ta"] as const;
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
  "Student Hour Allocation": z.number(),
});

export const AssignmentSchema = AllocationSchema.omit({
  "Student Hour Allocation": true,
}).extend({
  TAs: z.string().nullable(),
  "PLAs (formerly SAs)": z.string().nullable(),
  GLAs: z.string().nullable(),
});

export type Allocation = z.infer<typeof AllocationSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;

export const AssistantSchema = z.object({
  First: z.string().min(1, "First name is too short."),
  Last: z.string().min(1, "Last name is too short."),
  Email: z
    .string()
    .email()
    .endsWith("@wpi.edu", "Email does not end with @wpi.edu"),
});
export type Assistant = z.infer<typeof AssistantSchema>;

export const AssistantPreferencesSchema = AssistantSchema.extend({
  Comments: z.string().nullable(),
}) // Everything else (courses, "Available X Term?", time slots, etc.) becomes boolean
  .catchall(yesNoBoolean);
export type AssistantPreferences = z.infer<typeof AssistantPreferencesSchema>;
