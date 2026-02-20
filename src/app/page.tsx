import { auth } from "@/server/auth";
import ProfessorHomePageComponent from "@/components/professor/professor-dashboard/professor-homepage";
import { isAssistant, isCoordinator, isProfessor } from "@/lib/utils";
import { redirect } from "next/navigation";
import StaffHomePage from "@/components/staff/staff-homepage";
import { api } from "@/trpc/server";

export default async function Home() {
  const session = await auth();
  const activeTerm = await api.term.getActive();
  if (!session) return;

  if (isProfessor(session?.user)) {
    if (!activeTerm) return "No active term.";
    return (
      <ProfessorHomePageComponent
        professorId={session?.user?.id}
        termId={activeTerm.id}
      />
    );
  } else if (isAssistant(session?.user)) {
    return <StaffHomePage userId={session?.user?.id} />;
  } else if (isCoordinator(session?.user) && !isProfessor(session?.user)) {
    // rare case, for testing
    redirect("/dashboard");
  } else {
    return "you dont belong here.";
  }
}
