import { redirect } from "next/navigation";

export function redirectToForbidden() {
  return redirect("/error?error=AccessDenied");
}
