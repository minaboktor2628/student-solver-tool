import {
  defaultGLAHours,
  defaultMarginOfErrorOverAllocationHours,
  defaultMarginOfErrorShortAllocationHours,
  defaultPLAHours,
  defaultTAHours,
} from "@/lib/constants";
import { isExcelName, isExcelType } from "@/lib/utils";
import z from "zod";

// For backend validation.
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
    .describe(
      "Description: Calculated number of hours required per class.\n Format: Integer \nExample: 80",
    ),
  MOEOver: z
    .number()
    .describe(
      "Description: Margin of error allowed over the calculated hours.\n Format: Integer \nExample: 10",
    ),
  MOEShort: z
    .number()
    .describe(
      "Description: Margin of error allowed under the calculated hours. \n Format: Integer \nExample: 5",
    ),
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

export const MEETING_RE =
  /^(?<days>[MTWRF](?:-[MTWRF])*)\s*\|\s*(?<start>\d{1,2}:\d{2}\s[AP]M)\s*-\s*(?<end>\d{1,2}:\d{2}\s[AP]M)$/;

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
    Course: z
      .string()
      .regex(COURSE_RE, 'Expected like "CS 1102"')
      .describe(
        'Description: The course number.\n Format: Department + Course Number \nExample: "CS 1102"',
      ),
    Subsection: z
      .string()
      .regex(/^[A-Z]{1,3}\d{2,3}$/, 'Expected like "AL01" or "A01"')
      .describe(
        'Description: The subsection code of the course. \nFormat: String \nExample: "AL01"',
      ),
    Title: z
      .string()
      .describe(
        'Description: The title of the course. \nFormat: String \nExample: "Introduction to Program Design"',
      ),
  }),
);

export const AllocationWithoutAssistantsSchema = z.object({
  "Academic Period": z
    .string()
    .describe(
      'Description: The academic term that the course takes place in. \nFormat: Year + Season + Term \nExample: "2025 Fall A Term"',
    ),
  Section: SectionSchema.describe(
    'Description: The course number, subsection code and course title.\n Format: { Course: String, Subsection: String, Title: String } \nExample: { "Course": "CS 1005", "Subsection": "AL01", "Title": "Introduction to Program Design" }',
  ),
  "Meeting Pattern(s)": z
    .string()
    .nullable()
    .describe(
      'Description: The days and times the course meets.\n Format: Days | Start Time - End Time \nExample: "M-T-R-F | 10:00 AM - 10:50 AM"',
    ),
  Instructors: z
    .string()
    .nullable()
    .describe(
      'Description: The instructor(s) teaching the course.\n Format: Instructor Name(s) \nExample: "Joseph Quinn"',
    ),
  Enrollment: z
    .number()
    .describe(
      "Description: Current number of students enrolled in the section.\n Format: Integer \nExample: 75",
    ),
  "Waitlist Count": z
    .number()
    .describe(
      "Description: Current number of students on the waitlist.\n Format: Integer \nExample: 5",
    ),
  "Student Hour Allocation": numberWithMOE.describe(
    'Description: Number of student hours recommended for the course.\n Format: { Calculated: Int, MOEOver: Int, MOEShort: Int } \nExample: { "Calculated": 150, "MOEOver": 15, "MOEShort": 10 }',
  ),
});

export const AssistantSchema = z.object({
  First: z
    .string()
    .describe(
      'Description: Assistant\'s first name.\n Format: String \nExample: "Peter"',
    ),
  Last: z
    .string()
    .describe(
      'Description: Assistant\'s last name.\n Format: String \nExample: "Parker"',
    ),
  Email: z
    .string()
    .email()
    .endsWith("@wpi.edu")
    .describe(
      'Description: Assistant\'s WPI email address.\n Format: String \nExample: "pparker@wpi.edu"',
    ),
});

export type Assistant = z.infer<typeof AssistantSchema>;

const PeopleSchema = AssistantSchema.omit({ Email: true }).extend({
  Locked: z
    .boolean()
    .describe(
      "Description: Whether the assistant is locked to this assignment.\n Format: true | false \nExample: false",
    ),
  Hours: z
    .number()
    .describe(
      "Description: Number of hours assigned to this assistant.\n Format: Integer \nExample: 150 \n",
    ),
});
const PeopleArraySchema = z.array(PeopleSchema);
const makePeoplePreprocessor = (defaultHours: number) =>
  z.preprocess((val) => {
    if (val == null) return [];

    if (typeof val !== "string") {
      return val;
    }
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
  TAs: PeopleArraySchema.describe(
    'Description: List of assigned TAs for this course.\n Format: Array of { First: String, Last: String, Locked: Boolean, Hours: Integer } \nExample: [{ "First": "Peter", "Last": "Parker", "Locked": false, "Hours": 150 }]',
  ),
  PLAs: PeopleArraySchema.describe(
    'Description: List of assigned PLAs for this course.\n Format: Array of { First: String, Last: String, Locked: Boolean, Hours: Integer } \nExample: [{ "First": "Peter", "Last": "Parker", "Locked": false, "Hours": 150 }]',
  ),
  GLAs: PeopleArraySchema.describe(
    'Description: List of assigned GLAs for this course.\n Format: Array of { First: String, Last: String, Locked: Boolean, Hours: Integer } \nExample: [{ "First": "Peter", "Last": "Parker", "Locked": false, "Hours": 150 }]',
  ),
});
export type Allocation = z.infer<typeof AllocationSchema>;

const BASE_KEYS = new Set(["First", "Last", "Email", "Comments", "Available"]);

// Coerce any unknown-key value to boolean
const coerceUnknownKeyBooleans = (input: unknown) => {
  if (typeof input !== "object" || input === null) return input;
  const o = { ...(input as Record<string, unknown>) };

  for (const [k, v] of Object.entries(o)) {
    if (!BASE_KEYS.has(k)) {
      o[k] = yesNoBoolean.safeParse(v).success ? yesNoBoolean.parse(v) : !!v;
    }
  }
  return o;
};

export const AssistantPreferencesSchema = z.preprocess(
  // normalize "Available..." keys
  (val) => coerceUnknownKeyBooleans(normalizeAvailableKeys(val)),
  //validate base fields, allow passthrough for extras
  AssistantSchema.extend({
    Comments: z
      .string()
      .nullable()
      .describe(
        'Description: Additional comments from the assistant.\n Format: String | null \nExample: "CS3703 > CS1101"',
      ),
    Available: yesNoBoolean.describe(
      "Description: Indicates if the assistant is available.\n Format: true | false \nExample: true",
    ), // guaranteed to exist via normalizeAvailableKeys
  })
    .passthrough()
    // enforce that every *extra* key matches COURSE_RE or MEETING_RE
    .superRefine((obj, ctx) => {
      for (const key of Object.keys(obj)) {
        if (BASE_KEYS.has(key)) continue;

        const isCourse = COURSE_RE.test(key);
        const isMeeting = MEETING_RE.test(key);

        if (!isCourse && !isMeeting) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message:
              'Key must be a course like "CS 1102" or a meeting like "M-T-R-F | 9:00 AM - 9:50 AM"',
          });
        }
      }
    }),
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
