import { auth } from "@/server/auth";
import { redirect } from "next/dist/client/components/navigation";
import ProfessorPreferenceForm from "@/components/professor/preference-form/professor-preference-form";

export default async function ProfessorPreferencesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <ProfessorPreferenceForm userId={session.user.id} />;
}
