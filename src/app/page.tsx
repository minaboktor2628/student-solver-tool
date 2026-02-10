import { auth } from "@/server/auth";
import ProfessorHomePageComponent from "@/components/professor/professor-dashboard/professor-homepage";
import { isAssistant, isProfessor } from "@/lib/utils";

export default async function Home() {
  const session = await auth();

  if (!session) return;

  if (isProfessor(session)) {
    return <ProfessorHomePageComponent userId={session?.user?.id} />;
  } else if (isAssistant(session)) {
    return "hi assistant" + session.user.name;
  } else {
    return "you dont belong here.";
  }
}
