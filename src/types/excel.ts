import {
  defaultGLAHours,
  defaultMarginOfErrorOverAllocationHours,
  defaultMarginOfErrorShortAllocationHours,
  defaultPLAHours,
  defaultTAHours,
} from "@/lib/constants";
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
  Calculated: z
    .number()
    .describe("Description: Calculated number of hours required per class.\n Format: Integer \nExample: 80 \nType: Integer"),
  MOEOver: z
    .number()
    .describe("Description: Margin of error allowed over the calculated hours.\n Format: Integer \nExample: 10 \nType: Integer"),
  MOEShort: z
    .number()
    .describe("Description: Margin of error allowed under the calculated hours. \n Format: Integer \nExample: 5 \nType: Integer"),
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
  const defaultMarginOfErrorOver = defaultMarginOfErrorOverAllocationHours();
  const defaultMarginOfErrorShort = defaultMarginOfErrorShortAllocationHours();
  if (val && typeof val === "object" && !Array.isArray(val)) {
    const o = val as Record<string, unknown>;
    return {
      Calculated: toNumber(o.Calculated),
      MOEOver: toNumber(o.MOEOver ?? defaultMarginOfErrorOver),
      MOEShort: toNumber(o.MOEShort ?? defaultMarginOfErrorShort),
    };
  }
  return {
    Calculated: toNumber(val),
    MOEOver: defaultMarginOfErrorOver,
    MOEShort: defaultMarginOfErrorShort,
  };
}, NumberWithMOESchema);

// CS 2022-AL01/ MA 2201-AL01 - Discrete Mathematics
// Regex to capture "CS ####-XXX"
const CS_SECTION_RE =
  /^(?<dep>[A-Z]{2,4})\s*(?<num>\d{3,4})\s*[-–—]\s*(?<sub>[A-Z]{1,3}\d{2,3})(?:\s*\/\s*[A-Z]{2,4}\s*\d{3,4}\s*[-–—]\s*[A-Z]{1,3}\d{2,3}\s*)*(?:-?\s*)*(?<title>.*)$/i;

export const COURSE_RE = /^[A-Z]{2,4} \d{3,4}$/;

const SectionSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val;

    const m = CS_SECTION_RE.exec(val);
    if (!m?.groups) return val;

    const { dep, num, sub, title } = m.groups;
    return {
      Course: `${dep} ${num}`,
      Subsection: sub!.toUpperCase(),
      Title: title,
    };
  },
  z.object({
    Course: z.string().regex(COURSE_RE, 'Expected like "CS 1102"').describe("Description: The course number.\n Format: Department + Course Number \nExample: CS 1102 \nType: String"),
    Subsection: z
      .string()
      .regex(/^[A-Z]{1,3}\d{2,3}$/, 'Expected like "AL01" or "A01"')
      .describe("Description: The subsection code of the course. \nFormat: String \nExample: AL01 \nType: String"),
    Title: z.string().describe("Description: The title of the course. \nFormat: String \nExample: Introduction to Program Design \nType: String"),
  }),
);

export const AllocationWithoutAssistantsSchema = z.object({
  "Academic Period": z
    .string()
    .describe("Description: The academic term that the course takes place in. \nFormat: Year + Season + Term \nExample: 2025 Fall A Term \nType: String"),
  Section: SectionSchema.describe(
    "Description: The course number, subsection code and course title.\n Format: { Course: String, Subsection: String, Title: String } \nExample: { \"Course\": \"CS 1005\", \"Subsection\": \"AL01\", \"Title\": \"Introduction to Program Design\" } \nType: Object",
  ),
  CrossListed: yesNoBoolean.describe(
    "Description: Indicates if the course is cross-listed with another department.\n Format: true | false \nExample: false \nType: Boolean",
  ),
  "Meeting Pattern(s)": z
    .string()
    .nullable()
    .describe("Description: The days and times the course meets.\n Format: Days | Start Time - End Time \nExample: M-T-R-F | 10:00 AM - 10:50 AM \nType: String"),
  Instructors: z
    .string()
    .nullable()
    .describe("Description: The instructor(s) teaching the course.\n Format: Instructor Name(s) \nExample: Joseph Quinn \nType: String"),
  "Reserved Cap": z
    .number()
    .nullable()
    .describe("Description: Number of seats reserved for certain students.\n Format: Integer \nExample: 2 \nType: Integer"),
  "Cap Breakdown": z
    .string()
    .nullable()
    .describe("Description: Breakdown of reserved seats by group, if applicable.\n Format: Object | null \nExample: 80 - reserved for Student Records - Student is a First Year for 2025-2026 or Mass Academy until 08/11/2025 \nType: Object | Null"),
  "Section Cap": z
    .number()
    .nullable()
    .describe("Description: The maximum number of students allowed in the section.\n Format: Integer \nExample: 80 \nType: Integer"),
  Enrollment: z
    .number()
    .describe("Description: Current number of students enrolled in the section.\n Format: Integer \nExample: 75 \nType: Integer"),
  "Waitlist Count": z
    .number()
    .describe("Description: Current number of students on the waitlist.\n Format: Integer \nExample: 5 \nType: Integer"),
  "Student Hour Allocation": numberWithMOE.describe(
    "Description: Number of student hours recommended for the course.\n Format: { Calculated: Int, MOEOver: Int, MOEShort: Int } \nExample: { \"Calculated\": 150, \"MOEOver\": 15, \"MOEShort\": 10 } \nType: Object",
  ),
});

export const AssistantSchema = z.object({
  First: z.string().describe("Description: Assistant's first name.\n Format: String \nExample: \"Peter\" \nType: String"),
  Last: z.string().describe("Description: Assistant's last name.\n Format: String \nExample: \"Parker\" \nType: String"),
  Email: z
    .string()
    .email()
    .endsWith("@wpi.edu")
    .describe("Description: Assistant's WPI email address.\n Format: String \nExample: \"pparker@wpi.edu\" \nType: String"),
});

export type Assistant = z.infer<typeof AssistantSchema>;

const PeopleSchema = AssistantSchema.omit({ Email: true }).extend({
  Locked: z
    .boolean()
    .describe("Description: Whether the assistant is locked to this assignment.\n Format: true | false \nExample: false \nType: Boolean"),
  Hours: z.number().describe("Description: Number of hours assigned to this assistant.\n Format: Integer \nExample: 150 \nType: Integer"),
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

export const AssistantEnumTypeSchema = z.enum(["PLA", "GLA", "TA"]);
export type AssistantEnumType = z.infer<typeof AssistantEnumTypeSchema>;
export const AssignmentSchema = AllocationWithoutAssistantsSchema.omit({
  "Student Hour Allocation": true,
}).extend({
  TAs: makePeoplePreprocessor(defaultTAHours()),
  PLAs: makePeoplePreprocessor(defaultPLAHours()),
  GLAs: makePeoplePreprocessor(defaultGLAHours()),
});

export type AllocationWithoutAssistants = z.infer<
  typeof AllocationWithoutAssistantsSchema
>;
export type Assignment = z.infer<typeof AssignmentSchema>;

export const AllocationSchema = AllocationWithoutAssistantsSchema.extend({
  TAs: PeopleArraySchema.describe("Description: List of assigned TAs for this course.\n Format: Array of { First: String, Last: String, Locked: Boolean, Hours: Integer } \nExample: [{ \"First\": \"Peter\", \"Last\": \"Parker\", \"Locked\": false, \"Hours\": 150 }] \nType: Array"),
  PLAs: PeopleArraySchema.describe("Description: List of assigned PLAs for this course.\n Format: Array of { First: String, Last: String, Locked: Boolean, Hours: Integer } \nExample: [{ \"First\": \"Peter\", \"Last\": \"Parker\", \"Locked\": false, \"Hours\": 150 }] \nType: Array"),
  GLAs: PeopleArraySchema.describe("Description: List of assigned GLAs for this course.\n Format: Array of { First: String, Last: String, Locked: Boolean, Hours: Integer } \nExample: [{ \"First\": \"Peter\", \"Last\": \"Parker\", \"Locked\": false, \"Hours\": 150 }] \nType: Array"),
});
export type Allocation = z.infer<typeof AllocationSchema>;

export const AssistantPreferencesSchema = z.preprocess(
  normalizeAvailableKeys,
  AssistantSchema.extend({
    Comments: z
      .string()
      .nullable()
      .describe("Description: Additional comments from the assistant.\n Format: String | null \nExample: \"CS3703 > CS1101\" \nType: String | null"),
    // ensure "Available" exists after preprocessing
    Available: yesNoBoolean.describe(
      "Description: Whether the assistant is available for the assignment.\n Format: true | false \nExample: true \nType: Boolean",
    ),
  })
    // every other key (courses, timeslots, etc.) -> boolean
    .catchall(yesNoBoolean)
    .describe("Description: Preference field indicating courses, timeslots, etc.\n Format: true | false \nExample: \"CS 1101\": true \nType: Boolean"),
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
