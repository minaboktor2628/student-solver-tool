import type { SolverAssignments, SolverData } from ".";

export function greedy({
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

  // Professor prefers these staff for each section
  const profPreferredBySection = new Map<string, Set<string>>(); // sectionId -> Set<staffId>

  for (const section of sections) {
    const preferredStaff =
      section.professorPreference?.preferredStaff?.map((p) => p.staff.id) ?? [];
    profPreferredBySection.set(section.id, new Set(preferredStaff));
  }

  // Staff prefer these sections (with a score based on rank)
  const staffPreferredSectionScore = new Map<string, Map<string, number>>(); // staffId -> (sectionId -> score)

  for (const sp of staffPreferences) {
    const staffId = sp.user.id;
    const sectionScoreMap =
      staffPreferredSectionScore.get(staffId) ?? new Map<string, number>();

    for (const pref of sp.preferredSections) {
      // Rank-based scoring: strongly pref > pref
      const baseScore =
        pref.rank === "STRONGLY_PREFER" ? 2 : pref.rank === "PREFER" ? 1 : 0;

      sectionScoreMap.set(pref.sectionId, baseScore);
    }

    staffPreferredSectionScore.set(staffId, sectionScoreMap);
  }

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

    // sorting by prof and assistant prefs
    const profPreferredSet =
      profPreferredBySection.get(sectionId) ?? new Set<string>();

    function getStaffPrefScore(staffId: string, sectionId: string): number {
      const sectionScoreMap = staffPreferredSectionScore.get(staffId);
      if (!sectionScoreMap) return 0;
      return sectionScoreMap.get(sectionId) ?? 0;
    }

    filteredStaff.sort((a, b) => {
      // professor preference
      const aProf = profPreferredSet.has(a) ? 1 : 0;
      const bProf = profPreferredSet.has(b) ? 1 : 0;
      if (aProf !== bProf) {
        // preferred staff first
        return bProf - aProf;
      }

      // staff's own preference for this section
      const aStaffScore = getStaffPrefScore(a, sectionId);
      const bStaffScore = getStaffPrefScore(b, sectionId);
      if (aStaffScore !== bStaffScore) {
        // higher score (STRONGLY_PREFER) first
        return bStaffScore - aStaffScore;
      }

      // tie-breaker: less hours available first
      const aHours = staffToHours.get(a) ?? 0;
      const bHours = staffToHours.get(b) ?? 0;
      return aHours - bHours;
    });

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

// NOT avoided by that professor
// AND is qualified
function getLegalAssignmentsForSection({
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
