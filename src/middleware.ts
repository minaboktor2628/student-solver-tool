import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "./env";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: env.AUTH_SECRET });

  const { origin, href } = req.nextUrl;

  if (!token) {
    const url = new URL("/login", origin);
    url.searchParams.set("callbackUrl", href);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|error|login).*)"],
};
