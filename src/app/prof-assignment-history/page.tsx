import { isUserAllowedInActiveTerm } from "@/lib/permission-helpers";
import { LoadingSpinner } from "@/components/loading-spinner";
import ProfessorAssignmentsCard from "@/components/professor/professor-dashboard/professor-assignments-card";
import { hasPermission } from "@/lib/permissions";
import { redirectToForbidden } from "@/lib/navigation";
import type { AppRouter } from "@/server/api/root";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import type { inferRouterOutputs } from "@trpc/server";

export const metadata = {
  title: "Professor Assignment History",
  description: "View all past professor course assignments",
};

type RouterOutputs = inferRouterOutputs<AppRouter>;
type HistorySection =
  RouterOutputs["professorDashboard"]["getPastProfessorAssignments"]["sections"][number];
type AssignmentSection =
  RouterOutputs["professorDashboard"]["getProfessorAssignments"]["sections"][number];

type TermGroup = {
  termId: HistorySection["termId"];
  termLetter: HistorySection["termLetter"];
  year: HistorySection["year"];
  sections: AssignmentSection[];
};

export default async function ProfessorAssignmentHistoryPage() {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) return <LoadingSpinner />;

  if (
    !hasPermission(session.user, "professorPreferenceForm", "viewHistory", {
      userId,
      isAllowedInActiveTerm: await isUserAllowedInActiveTerm(userId),
    })
  ) {
    redirectToForbidden();
  }

  const { sections } = await api.professorDashboard.getPastProfessorAssignments(
    {
      professorId: userId,
    },
  );

  const termsById: Record<string, TermGroup> = {};
  for (const section of sections) {
    let termGroup = termsById[section.termId];
    if (!termGroup) {
      termGroup = {
        termId: section.termId,
        termLetter: section.termLetter,
        year: section.year,
        sections: [],
      };
      termsById[section.termId] = termGroup;
    }

    termGroup.sections.push({
      sectionId: section.sectionId,
      courseCode: section.courseCode,
      courseSection: section.courseSection,
      courseTitle: section.courseTitle,
      meetingPattern: section.meetingPattern,
      assignedStaff: section.assignedStaff,
    });
  }

  const termGroups = Object.values(termsById);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Assignment History</h1>
        <p className="text-muted-foreground mt-2">
          View all past course assignments and assigned assistants
        </p>
      </div>

      {termGroups.length > 0 &&
        termGroups.map((term) => (
          <div key={term.termId} className="mb-6">
            <ProfessorAssignmentsCard
              sections={term.sections}
              termLetter={term.termLetter}
              termYear={term.year}
            />
          </div>
        ))}

      {termGroups.length === 0 && <h2>No past assignments found</h2>}
    </div>
  );
}
