import { redirectToForbidden } from "@/lib/navigation";
import { isAssistant } from "@/lib/utils";
import { auth } from "@/server/auth";

export default async function Layout(props: LayoutProps<"/dashboard">) {
  const session = await auth();

  if (!isAssistant(session)) redirectToForbidden();

  return props.children;
}
