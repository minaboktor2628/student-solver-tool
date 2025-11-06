import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { origin, href } = req.nextUrl;

  // not signed in → send to login, preserve callback
  if (!req.auth) {
    const url = new URL("/login", origin);
    url.searchParams.set("callbackUrl", href);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|error|login).*)"],
};
