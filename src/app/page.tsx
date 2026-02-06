import { auth } from "@/server/auth";
import ProfessorHomePageComponent from "@/components/professor/professor-dashboard/professor-homepage";

export default async function Home() {
  const session = await auth();

  if (
    session?.user?.roles?.includes("PROFESSOR") &&
    !session?.user?.roles?.includes("COORDINATOR")
  ) {
    return <ProfessorHomePageComponent userId={session?.user?.id} />;
  } else {
    return (
      <h1 className="p-4 text-lg font-medium">
        Home page, this should prob redirect you somewhere diff for each role
        type?
      </h1>
    );
  }
}
