import type { Role } from "@prisma/client";

export function defaultTAHours() {
  return 20;
}

export function defaultPLAHours() {
  return 10;
}

export function defaultGLAHours() {
  return 10;
}

export function getDefaultHoursForRole(role: Role) {
  if (role === "TA") return defaultTAHours();
  else if (role === "GLA") return defaultGLAHours();
  else if (role === "PLA") return defaultPLAHours();
  else return 0;
}

export function defaultMarginOfErrorShortAllocationHours() {
  return 10;
}

export function defaultMarginOfErrorOverAllocationHours() {
  return 10;
}
