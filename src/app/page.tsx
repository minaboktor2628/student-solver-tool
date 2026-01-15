import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();

  // Redirect professors to their dashboard
  if (session?.user?.roles?.includes("PROFESSOR")) {
    redirect("/professor");
  }

  return (
    <h1 className="p-4 text-lg font-medium">
      Home page, this should prob redirect you somewhere diff for each role
      type?
    </h1>
  );
}
