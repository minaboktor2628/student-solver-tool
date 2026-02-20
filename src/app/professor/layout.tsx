import { redirectToForbidden } from "@/lib/navigation";
import { isProfessor } from "@/lib/utils";
import { auth } from "@/server/auth";
import type { ReactNode } from "react";

export default async function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await auth();

  if (!isProfessor(session?.user)) {
    redirectToForbidden();
    return null;
  }

  return <>{children}</>;
}
