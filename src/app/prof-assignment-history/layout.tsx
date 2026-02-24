import { redirectToForbidden } from "@/lib/navigation";
import { isProfessor } from "@/lib/utils";
import { auth } from "@/server/auth";

export default async function Layout(props: { children: React.ReactNode }) {
  const session = await auth();

  if (!isProfessor(session?.user)) redirectToForbidden();

  return props.children;
}
