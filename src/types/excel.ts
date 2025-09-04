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

// For course alloc number
const numberWithMOE = z.preprocess(
  (val) => {
    let num = 0;

    if (val === null || val === undefined) {
      num = 0;
    } else if (typeof val === "string") {
      const trimmed = val.trim().toLowerCase();
      if (trimmed === "" || trimmed === "tbd" || trimmed === "n/a") {
        num = 0;
      } else {
        const parsed = Number(val);
        num = Number.isNaN(parsed) ? 0 : parsed;
      }
    } else if (typeof val === "number") {
      num = val;
    }

    return { Calculated: num, MOE: 10 };
  },
  z.object({
    Calculated: z.number(),
    MOE: z.number(),
  }),
);

// Regex to capture "CS ####-XXX"
const CS_SECTION_RE = /CS\s*([0-9]{3,4})\s*[-–—]\s*([A-Z]{1,3}\d{2,3})/i;

const SectionSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val;

    const m = CS_SECTION_RE.exec(val);
    if (!m) return val;

    const [, courseNum, subsection] = m;
    return {
      Course: `CS ${courseNum}`,
      Subsection: subsection!.toUpperCase(),
    };
  },
  z.object({
    Course: z.string().regex(/^CS \d{3,4}$/, 'Expected like "CS 1102"'),
    Subsection: z
      .string()
      .regex(/^[A-Z]{1,3}\d{2,3}$/, 'Expected like "AL01" or "A01"'),
  }),
);

export const AllocationSchema = z.object({
  "Academic Period": z.string(),
  Section: SectionSchema,
  CrossListed: yesNoBoolean,
  "Meeting Pattern(s)": z.string().nullable(),
  Instructors: z.string().nullable(),
  "Reserved Cap": z.number().nullable(),
  "Cap Breakdown": z.string().nullable(),
  "Section Cap": z.number().nullable(),
  Enrollment: z.number(),
  "Waitlist Count": z.number(),
  "Student Hour Allocation": numberWithMOE,
});

export const AssistantSchema = z.object({
  First: z.string(),
  Last: z.string(),
  Email: z.string().email().endsWith("@wpi.edu"),
});

export type Assistant = z.infer<typeof AssistantSchema>;

const makePeoplePreprocessor = (defaultHours: number) =>
  z.preprocess(
    (val) => {
      if (val === null) return [];
      if (typeof val !== "string") return [];

      // normalize whitespace (replace newlines/tabs/periods with comma)
      // TODO: Should we replace periods or make it an error?
      const normalized = val.replace(/[\n\t.]/g, ",");

      return normalized
        .split(";")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const [last, first] = entry.split(",").map((s) => s.trim());
          return {
            First: first ?? "",
            Last: last ?? "",
            Locked: false,
            Hours: defaultHours,
          };
        });
    },
    z.array(
      AssistantSchema.omit({ Email: true })
        .extend({ Locked: z.boolean(), Hours: z.number() })
        .nullable(),
    ),
  );

export const AssignmentSchema = AllocationSchema.omit({
  "Student Hour Allocation": true,
}).extend({
  TAs: makePeoplePreprocessor(20),
  PLAs: makePeoplePreprocessor(10),
  GLAs: makePeoplePreprocessor(20),
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

export const ExcelSheetSchema = {
  Allocations: AllocationSchema,
  Assignments: AssignmentSchema,
  TAs: AssistantSchema,
  PLAs: AssistantSchema,
  GLAs: AssistantSchema,
  "PLA Preferences": AssistantPreferencesSchema,
  "TA Preferences": AssistantPreferencesSchema,
} as const satisfies Record<ExcelSheetNameEnum, z.ZodTypeAny>;

type ArraySchemaMap<M extends Record<string, z.ZodTypeAny>> = {
  [K in keyof M]: z.ZodArray<M[K]>;
};

function toArraySchemas<M extends Record<string, z.ZodTypeAny>>(
  m: M,
  min = 1,
): ArraySchemaMap<M> {
  const entries = Object.entries(m).map(([k, v]) => [k, z.array(v).min(min)]);
  return Object.fromEntries(entries) as ArraySchemaMap<M>;
}

export const ValidationArraySchemasBySheetName =
  toArraySchemas(ExcelSheetSchema);

export const ValidationInputSchema = z.object(
  ValidationArraySchemasBySheetName,
);

export type ValidationInput = z.infer<typeof ValidationInputSchema>;
