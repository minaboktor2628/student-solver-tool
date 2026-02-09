import { auth } from "@/server/auth";
import ProfessorHomePageComponent from "@/components/professor/professor-dashboard/professor-homepage";
import StaffHomePage from "@/components/staff/staff-homepage";

export default async function Home() {
  const session = await auth();

  if (session?.user?.roles?.includes("PROFESSOR")) {
    return <ProfessorHomePageComponent userId={session?.user?.id} />;
  } else if (
    session?.user?.roles?.includes("PLA") ||
    session?.user?.roles?.includes("TA")
  ) {
    return <StaffHomePage userId={session?.user?.id} />;
  } else {
    return (
      <h1 className="p-4 text-lg font-medium">
        Home page, this should prob redirect you somewhere diff for each role
        type?
      </h1>
    );
  }
}
