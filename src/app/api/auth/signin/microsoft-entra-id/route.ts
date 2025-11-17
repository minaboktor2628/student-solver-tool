import { NextResponse } from "next/server";
import { signIn } from "@/server/auth";
import { AuthError } from "next-auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const callbackUrl = url.searchParams.get("callbackUrl") ?? "";
  try {
    return await signIn("microsoft-entra-id", { redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(new URL(`/error?error=${error.type}`, url));
    }
    throw error;
  }
}
