import { auth } from "@/server/auth";
import ProfessorPreferenceForm from "@/components/professor/preference-form/professor-preference-form";
import { LoadingSpinner } from "@/components/loading-spinner";

export default async function ProfessorPreferencesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <LoadingSpinner />;
  }

  return <ProfessorPreferenceForm userId={session.user.id} />;
}
