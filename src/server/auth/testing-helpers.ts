import type { Role } from "@/types/global";

export const testingPasswordMap: Record<string, Role[]> = {
  testpla: ["PLA"],
  testta: ["TA"],
  testprof: ["PROFESSOR"],
  testcoordinator: ["PROFESSOR", "COORDINATOR"],
} as const;
