import { auth } from "@/server/auth";
import ProfessorHomePageComponent from "@/components/professor/professor-dashboard/professor-homepage";
import { isAssistant, isCoordinator, isProfessor } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) return;

  if (isProfessor(session)) {
    return <ProfessorHomePageComponent userId={session?.user?.id} />;
  } else if (isAssistant(session)) {
    return "hi assistant" + session.user.name;
  } else if (isCoordinator(session) && !isProfessor(session)) {
    // rare case, for testing
    redirect("dashboard");
  } else {
    return "you dont belong here.";
  }
}
