import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardContent from "./dashboard-content";

export default async function DashboardPage() {
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has COORDINATOR role
  const hasCoordinatorRole = session.user.roles?.includes("COORDINATOR");

  if (!hasCoordinatorRole) {
    // User doesn't have the required role
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
          <h1 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
            Access Denied
          </h1>
          <p className="mb-4 text-lg text-red-700 dark:text-red-300">
            You do not have permission to access the Dashboard.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Only coordinators can access this page. If you believe this is an
            error, please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardContent />;
}
