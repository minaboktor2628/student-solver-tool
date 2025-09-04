import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isExcelName = (name: string) => /\.xlsx?$/i.test(name);
export const isExcelType = (type: string) =>
  type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
  type === "application/vnd.ms-excel";

// example 'report:2025/08/28*final?.txt' → 'report_2025_08_28_final_.txt'
export const toSafeFilename = (name: string) =>
  `${name}` // 1. Ensure it's a string
    .trim() // 2. Remove leading/trailing spaces
    .replace(/[\\/:"*?<>|]+/g, "_") // 3. Replace forbidden filename characters with "_"
    .replace(/\s+/g, "_"); // 4. Replace any whitespace with "_"
