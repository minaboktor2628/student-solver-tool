import { auth } from "@/server/auth";
import { hasPermission, matchRoute } from "@/lib/permissions";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { origin, pathname, href } = req.nextUrl;

  // not signed in → send to login, preserve callback
  if (!req.auth) {
    const url = new URL("/login", origin);
    url.searchParams.set("callbackUrl", href);
    return NextResponse.redirect(url);
  }

  // If this path isn't governed by our permissions table, let it through.
  const hit = matchRoute(pathname);
  if (!hit) return NextResponse.next();

  // Enforce the permission for governed paths (nested included).
  const allowed = hasPermission(req.auth.user, "pages", "view", pathname);
  if (!allowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|error|login).*)"],
};
