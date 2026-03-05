import type { Day } from "@prisma/client";

export type Slot = {
  day: Day;
  hour: number;
};

export function slotToKey(slot: Slot) {
  return `${slot.day}:${slot.hour}`;
}

export const isSlot = (s: Slot | null): s is Slot => s !== null;

export function dedupe(slots: Slot[]): Slot[] {
  const seen = new Map<string, Slot>();
  for (const slot of slots) {
    seen.set(slotToKey(slot), slot);
  }
  return [...seen.values()];
}

export type CoverageStats = {
  percent: number;
  covered: Slot[];
  uncovered: Slot[];
  totalNeeded: number;
  totalCovered: number;
};

export function calculateCoverage(
  neededSlots: Slot[],
  availableSlots: Slot[],
): CoverageStats {
  // Deduplicate to avoid counting duplicates twice
  const needed = dedupe(neededSlots);
  const available = dedupe(availableSlots);

  if (needed.length === 0) {
    return {
      percent: 100,
      covered: [],
      uncovered: [],
      totalNeeded: 0,
      totalCovered: 0,
    };
  }

  const availableSet = new Set(available.map(slotToKey));

  const covered: Slot[] = [];
  const uncovered: Slot[] = [];

  for (const n of needed) {
    if (availableSet.has(slotToKey(n))) {
      covered.push(n);
    } else {
      uncovered.push(n);
    }
  }

  const totalNeeded = needed.length;
  const totalCovered = covered.length;
  const percent = Math.round((totalCovered / totalNeeded) * 100 * 100) / 100;

  return { percent, covered, uncovered, totalNeeded, totalCovered };
}
