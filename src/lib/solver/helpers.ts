import type { SolverData } from ".";

// NOT avoided by that professor
// AND is qualified
export function getLegalAssignmentsForSection({
  staffPreferences,
  sections,
}: SolverData): Map<string, string[]> {
  const sectionLegalStaff = new Map<string, string[]>();

  // Precompute avoided staff per section
  const avoidedBySection = new Map<string, Set<string>>();

  for (const section of sections) {
    const avoidedIds = new Set(
      section.professorPreference?.avoidedStaff?.map((a) => a.staff.id) ?? [],
    );

    avoidedBySection.set(section.id, avoidedIds);
  }

  // For each staff preference, look at the sections they’re qualified for
  for (const staffPref of staffPreferences) {
    const staffId = staffPref.user.id;

    for (const qualified of staffPref.qualifiedForSections) {
      const sectionId = qualified.sectionId;
      const avoidedSet = avoidedBySection.get(sectionId) ?? new Set<string>();

      // Skip if professor explicitly avoids this staff member
      if (avoidedSet.has(staffId)) continue;

      // Add staff to legal list for this section
      const current = sectionLegalStaff.get(sectionId);
      if (current) {
        current.push(staffId);
      } else {
        sectionLegalStaff.set(sectionId, [staffId]);
      }
    }
  }

  return sectionLegalStaff;
}
