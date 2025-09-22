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
  Calculated: z.number(),
  MOEOver: z.number(),
  MOEShort: z.number(),
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
    Course: z.string().regex(COURSE_RE, 'Expected like "CS 1102"'),
    Subsection: z
      .string()
      .regex(/^[A-Z]{1,3}\d{2,3}$/, 'Expected like "AL01" or "A01"'),
    Title: z.string(),
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

export const AssistantEnumTypeSchema = z.enum(["PLAs", "GLAs", "TAs"]);
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
  TAs: PeopleArraySchema,
  PLAs: PeopleArraySchema,
  GLAs: PeopleArraySchema,
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
    Comments: z.string().nullable(),
    Available: yesNoBoolean, // guaranteed to exist via normalizeAvailableKeys
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
