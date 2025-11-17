import { clsx, type ClassValue } from "clsx";
import type { Session } from "next-auth";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
