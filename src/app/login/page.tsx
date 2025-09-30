import { redirect } from "next/navigation";

export default function LoginPage() {
  // TODO: better custom login page
  redirect("/api/auth/signin");
}
