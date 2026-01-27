import { auth } from "@/server/auth";
import { redirect } from "next/dist/client/components/navigation";
import ProfessorHomePageComponent from "@/components/professor/professor-dashboard/professor-homepage";

export default async function ProfessorHomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <ProfessorHomePageComponent userId={session.user.id} />;
}
