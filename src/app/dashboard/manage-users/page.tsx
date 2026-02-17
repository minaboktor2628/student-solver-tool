import { auth } from "@/server/auth";
import ManageUsersContent from "./manage-users-content";
import { redirect } from "next/navigation";

export default async function ManageUsersPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  return <ManageUsersContent />;
}
