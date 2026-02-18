import { auth } from "@/server/auth";
import ProfessorHomePageComponent from "@/components/professor/professor-dashboard/professor-homepage";
import { isAssistant, isProfessor } from "@/lib/utils";
import { api } from "@/trpc/server";

export default async function Home() {
  const session = await auth();
  const activeTerm = await api.term.getActive();
  if (!session) return;

  if (isProfessor(session)) {
    if (!activeTerm) return "No active term.";
    return (
      <ProfessorHomePageComponent
        professorId={session?.user?.id}
        termId={activeTerm.id}
      />
    );
  } else if (isAssistant(session)) {
    return "hi assistant" + session.user.name;
  } else {
    return "you dont belong here.";
  }
}
