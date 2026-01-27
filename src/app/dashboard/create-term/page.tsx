import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import CreateTermContent from "./create-term-content";

export default async function CreateTermPage() {
  const session = await auth();

  // Check if user is authenticated and has COORDINATOR role
  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.roles?.includes("COORDINATOR")) {
    redirect("/error?code=access_denied");
  }

  return <CreateTermContent />;
}
