import { auth } from "@/server/auth";
import ProfessorHomePageComponent from "@/components/professor/professor-dashboard/professor-homepage";
import { LoadingSpinner } from "@/components/loading-spinner";

export default async function ProfessorHomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <LoadingSpinner />;
  }

  return <ProfessorHomePageComponent userId={session.user.id} />;
}
