import { auth } from "@/server/auth";
import ManageCoursesContent from "./manage-courses-content";
import { redirect } from "next/navigation";

export default async function ManageCoursesPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  return <ManageCoursesContent />;
}
