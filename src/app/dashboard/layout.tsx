import { redirectToForbidden } from "@/lib/navigation";
import { isCoordinator } from "@/lib/utils";
import { auth } from "@/server/auth";

export default async function Layout(props: LayoutProps<"/dashboard">) {
  const session = await auth();

  if (!isCoordinator(session)) redirectToForbidden();

  return props.children;
}
