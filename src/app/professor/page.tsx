import { auth } from "@/server/auth";
import ProfessorPreferenceForm from "@/components/professor/preference-form/professor-preference-form";
import { LoadingSpinner } from "@/components/loading-spinner";
import { hasPermission } from "@/lib/permissions";
import { redirectToForbidden } from "@/lib/navigation";

export default async function ProfessorPreferencesPage() {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) return <LoadingSpinner />;

  if (
    !hasPermission(session.user, "professorPreferenceForm", "viewActiveTerm", {
      id: userId,
    })
  ) {
    redirectToForbidden();
  }

  return <ProfessorPreferenceForm userId={session.user.id} />;
}
