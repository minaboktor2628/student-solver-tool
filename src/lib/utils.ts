import { clsx, type ClassValue } from "clsx";
import type { Session } from "next-auth";
import { twMerge } from "tailwind-merge";

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

export function calculateRequiredHours(enrollment: number): number {
  const roundedUp = Math.ceil(enrollment / 5) * 5;
  const divided = roundedUp / 2;
  const requiredHours = Math.floor(divided / 10) * 10;
  return requiredHours;
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

export function toFullCourseName(section: string, code: string, title: string) {
  return `${section}-${code} - ${title}`;
}

export function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents
}
