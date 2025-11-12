import { clsx, type ClassValue } from "clsx";
import type { Session } from "next-auth";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateRequiredAssistantHours(
  enrolledStudents: number,
): number {
  // Ceiling to nearest multiple of 5
  const ceiling = Math.ceil(enrolledStudents / 5) * 5;

  // Divide by 2
  const half = ceiling / 2;

  // Floor to nearest multiple of 10
  const result = Math.floor(half / 10) * 10;

  return result;
}

export const isExcelName = (name: string) => /\.xlsx?$/i.test(name);
export const isExcelType = (type: string) =>
  type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
  type === "application/vnd.ms-excel";

export function isCoordinator(session: Session | null) {
  return session?.user.roles.some((r) => r === "COORDINATOR");
}

export function isStudent(session: Session | null) {
  return session?.user.roles.some((r) => r === "TA" || r === "PLA");
}

export function isProfessor(session: Session | null) {
  return session?.user.roles.some((r) => r === "PROFESSOR");
}
