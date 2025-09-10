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

// Collapse any "Available ..." keys into one "Available" boolean
const normalizeAvailableKeys = (input: unknown) => {
  if (typeof input !== "object" || input === null) return input;

  const src = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  let availableAgg: boolean | undefined;

  for (const [key, value] of Object.entries(src)) {
    if (/^\s*available\b/i.test(key)) {
      const b = yesNoBoolean.safeParse(value).success
        ? yesNoBoolean.parse(value)
        : !!value;
      availableAgg = (availableAgg ?? false) || b;
    } else {
      out[key] = value;
    }
  }

  // Always ensure Available exists, default true if none present
  out.Available = availableAgg ?? true;

  return out;
};

// For course alloc number
export const NumberWithMOESchema = z.object({
  Calculated: z.number(),
  MOE: z.number(),
});
export type NumberWithMOE = z.infer<typeof NumberWithMOESchema>;

const toNumber = (v: unknown): number => {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "" || t === "tbd" || t === "n/a") return 0;
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

export const numberWithMOE = z.preprocess((val) => {
  const defaultMarginOfError = 10;
  if (val && typeof val === "object" && !Array.isArray(val)) {
    const o = val as Record<string, unknown>;
    return {
      Calculated: toNumber(o.Calculated),
      MOE: toNumber(o.MOE ?? defaultMarginOfError),
    };
  }
  return { Calculated: toNumber(val), MOE: defaultMarginOfError };
}, NumberWithMOESchema);

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

export const AllocationWithoutAssistantsSchema = z.object({
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

const PeopleSchema = AssistantSchema.omit({ Email: true }).extend({
  Locked: z.boolean(),
  Hours: z.number(),
});
const PeopleArraySchema = z.array(PeopleSchema);
const makePeoplePreprocessor = (defaultHours: number) =>
  z.preprocess((val) => {
    if (val == null) return [];
    if (Array.isArray(val)) return PeopleArraySchema.parse(val); // already parsed -> pass through

    if (typeof val === "string") {
      // normalize whitespace (replace newlines/tabs/periods with comma)
      // TODO: Should we replace periods or make it an error?
      const normalized = val.replace(/[\n\t.]/g, ",");
      return normalized
        .split(";")
        .map((s) => s.trim())
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
    }

    // Not string/array/null -> let schema fail instead of silently erasing data
    return z.NEVER;
  }, PeopleArraySchema);

export const AssignmentSchema = AllocationWithoutAssistantsSchema.omit({
  "Student Hour Allocation": true,
}).extend({
  TAs: makePeoplePreprocessor(20),
  PLAs: makePeoplePreprocessor(10),
  GLAs: makePeoplePreprocessor(10),
});

export type AllocationWithoutAssistants = z.infer<
  typeof AllocationWithoutAssistantsSchema
>;
export type Assignment = z.infer<typeof AssignmentSchema>;

export const AllocationSchema = AllocationWithoutAssistantsSchema.extend({
  TAs: PeopleArraySchema,
  PLAs: PeopleArraySchema,
  GLAs: PeopleArraySchema,
});
export type Allocation = z.infer<typeof AllocationSchema>;

export const AssistantPreferencesSchema = z.preprocess(
  normalizeAvailableKeys,
  AssistantSchema.extend({
    Comments: z.string().nullable(),
    // ensure "Available" exists after preprocessing
    Available: yesNoBoolean,
  })
    // every other key (courses, timeslots, etc.) -> boolean
    .catchall(yesNoBoolean),
);
export type AssistantPreferences = z.infer<typeof AssistantPreferencesSchema>;

export const ExcelSheetSchema = {
  Allocations: AllocationWithoutAssistantsSchema,
  Assignments: AssignmentSchema,
  "PLA Preferences": AssistantPreferencesSchema,
  "TA Preferences": AssistantPreferencesSchema,
} as const;

export const ValidationInputSchema = z.object({
  Allocations: z.array(AllocationSchema).min(1),
  "PLA Preferences": z.array(AssistantPreferencesSchema).min(1),
  "TA Preferences": z.array(AssistantPreferencesSchema).min(1),
});

export type ValidationInput = z.infer<typeof ValidationInputSchema>;
