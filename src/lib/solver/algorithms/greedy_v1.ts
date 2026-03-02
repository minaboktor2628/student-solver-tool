import type { SolverAssignments, SolverData } from "..";
import { getLegalAssignmentsForSection } from "../helpers";

export function greedy_v1({
  staffPreferences,
  sections,
}: SolverData): SolverAssignments {
  const assignments: SolverAssignments = new Map();

  const legalMap = getLegalAssignmentsForSection({
    staffPreferences,
    sections,
  });

  const staffToHours = new Map<string, number>(); // staffId -> hours they can help
  for (const sp of staffPreferences) {
    staffToHours.set(sp.user.id, sp.user.hours ?? 0);
  }

  const sectionCurrentHours = new Map<string, number>(); // sectionId -> help hours assigned
  const staffAssignedSection = new Set<string>(); // staffId -> sectionId (staff can only be assigned to one section)

  for (const section of sections) {
    // get all the people that the coordinator manually locked.
    // we do not want the solver to override the locked sections.
    const lockedAssignments = section.assignments.filter((a) => a.locked);

    if (lockedAssignments.length > 0) {
      // set all the locked staff to a this section
      const lockedStaffIds = lockedAssignments.map((a) => a.staff.id);
      assignments.set(section.id, [...lockedStaffIds]);
      for (const a of lockedAssignments) {
        staffAssignedSection.add(a.staff.id);
      }

      // for this current section, sum up all the locked
      const totalLockedHours = lockedAssignments.reduce(
        (sum, a) => sum + (a?.staff?.hours ?? 0),
        0,
      );
      sectionCurrentHours.set(section.id, totalLockedHours);
    }
  }

  // iterate sections in order of most constrained (has less available legal assignments)
  const sortedSections = [...sections].sort((a, b) => {
    const aLegal = (legalMap.get(a.id) ?? []).length;
    const bLegal = (legalMap.get(b.id) ?? []).length;
    // fewer legal staff first
    return aLegal - bLegal;
  });

  for (const section of sortedSections) {
    const sectionId = section.id;
    const requiredHours = section.requiredHours;
    const currentHours = sectionCurrentHours.get(sectionId) ?? 0;
    const neededHours = requiredHours - currentHours;
    if (neededHours <= 0) continue; // already satisfied (by locked assignments)

    let assignedHours = currentHours;
    const sectionAssignments = assignments.get(sectionId) ?? [];
    const legalStaff = [...(legalMap.get(sectionId) ?? [])];

    // filter out people already assigned to this section or are already assigned elsewhere
    const filteredStaff = legalStaff.filter(
      (s) => !staffAssignedSection.has(s) && !sectionAssignments.includes(s),
    );

    for (const staffId of filteredStaff) {
      if (sectionAssignments.includes(staffId)) continue;

      sectionAssignments.push(staffId);
      assignments.set(sectionId, sectionAssignments);
      staffAssignedSection.add(staffId);

      assignedHours += staffToHours.get(staffId) ?? 0;
      sectionCurrentHours.set(sectionId, assignedHours);

      if (assignedHours >= requiredHours) break;
    }
  }

  return assignments;
}
