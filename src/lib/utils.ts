import { clsx, type ClassValue } from "clsx";
import type { Session, User } from "next-auth";
import { twMerge } from "tailwind-merge";
import z from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateRequiredAssistantHours(
  enrolledStudents: number,
): number {
  if (enrolledStudents < 15) return 0;

  // Each 20 students (after the first 15) adds 10 hours
  const blocks = Math.floor((enrolledStudents - 15) / 20) + 1;
  return blocks * 10;
}

export const isExcelName = (name: string) => /\.xlsx?$/i.test(name);
export const isExcelType = (type: string) =>
  type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
  type === "application/vnd.ms-excel";

export function isCoordinator(user?: User) {
  return user?.roles?.some((r) => r === "COORDINATOR");
}

export function isAssistant(user?: User) {
  return user?.roles?.some((r) => r === "TA" || r === "PLA");
}

export function isProfessor(user?: User) {
  return user?.roles?.some((r) => r === "PROFESSOR");
}

export function toFullCourseName(section: string, code: string, title: string) {
  return `${section}-${code} - ${title}`;
}

export function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents
}

// take in something like professorId -> Professor Id
export function humanizeKey(k: string) {
  return k
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

// take in any value and turn it into a string
export function valToSafeString(value: unknown): string {
  if (value == null) return "";

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(valToSafeString).join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[unserializable]";
    }
  }

  // symbol, function, etc.
  return "";
}

// take in a zod type and return a human readable format
export function zodTypeHumanReadableLabel(field: z.ZodTypeAny): string {
  // unwrap optional/default/effects
  let f: z.ZodTypeAny = field;
  while (
    f instanceof z.ZodOptional ||
    f instanceof z.ZodNullable ||
    f instanceof z.ZodDefault ||
    f instanceof z.ZodEffects
  ) {
    // @ts-expect-error zod internal
    f = (f._def?.innerType ?? f._def?.schema) as z.ZodTypeAny;
  }

  if (f instanceof z.ZodString) return "string";
  if (f instanceof z.ZodNumber) return "number";
  if (f instanceof z.ZodBoolean) return "boolean";
  if (f instanceof z.ZodDate) return "date";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  if (f instanceof z.ZodEnum) return `enum(${f._def.values.join(" | ")})`;
  if (f instanceof z.ZodNativeEnum)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return `enum(${Object.values(f._def.values).join(" | ")})`;
  if (f instanceof z.ZodArray) return `array`;
  if (f instanceof z.ZodLiteral) return `literal(${String(f._def.value)})`;
  return "unknown";
}
