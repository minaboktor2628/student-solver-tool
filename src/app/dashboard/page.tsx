import { auth } from "@/server/auth";
import DashboardContent from "./dashboard-content";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  return (
    <>
      <p data-testid="dashboard-page"></p>
      <DashboardContent />
    </>
  );
}
