import { LoadingSpinner } from "@/components/loading-spinner";
import StaffAssignment from "@/components/staff/staff-assignment-card";
import { redirectToForbidden } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";

export const metadata = {
  title: "Assignment History",
  description: "View all past PLA/TA assignments",
};

export default async function PreferencesFormPage() {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) return <LoadingSpinner />;

  if (
    !hasPermission(session.user, "staffPreferenceForm", "viewHistory", {
      id: userId,
    })
  ) {
    redirectToForbidden();
  }

  const { assignments } = await api.studentDashboard.getPastAssignments({
    userId: userId,
  });
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Assignment History</h1>
        <p className="text-muted-foreground mt-2">View all past assignments</p>
      </div>
      {assignments.length > 0 &&
        assignments.map((assignment) => (
          <StaffAssignment
            key={assignment.id}
            termLetter={assignment.section.term.termLetter}
            year={assignment.section.term.year}
            courseCode={assignment.section.courseCode}
            courseTitle={assignment.section.courseTitle}
            courseSection={assignment.section.courseSection}
            professorName={assignment.section.professor.name}
            professorEmail={assignment.section.professor.email}
            meetingPattern={assignment.section.meetingPattern}
          />
        ))}
      {assignments.length === 0 && <h2>No past assignments found</h2>}
    </div>
  );
}
