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
