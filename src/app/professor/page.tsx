import { auth } from "@/server/auth";
import ProfessorPreferenceForm from "@/components/professor/preference-form/professor-preference-form";
import { LoadingSpinner } from "@/components/loading-spinner";
import { hasPermission, isUserAllowedInActiveTerm } from "@/lib/permissions";
import { redirectToForbidden } from "@/lib/navigation";
import { api } from "@/trpc/server";

export default async function ProfessorPreferencesPage() {
  const session = await auth();
  const activeTerm = await api.term.getActive();
  const userId = session?.user.id;

  if (!userId) return <LoadingSpinner />;
  if (!activeTerm) throw new Error("No active term in the database.");

  if (
    !hasPermission(session.user, "professorPreferenceForm", "viewActiveTerm", {
      userId,
      isAllowedInActiveTerm: await isUserAllowedInActiveTerm(userId),
    })
  ) {
    redirectToForbidden();
  }

  return (
    <ProfessorPreferenceForm userId={session.user.id} termId={activeTerm.id} />
  );
}
