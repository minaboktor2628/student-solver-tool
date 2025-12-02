import { auth } from "@/server/auth";
import { hasPermission, ROUTE_TO_PERMISSION } from "@/server/auth/permissions";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { origin, pathname, href } = req.nextUrl;

  // TEMPORARY: Skip auth for professor pages (mockup demo)
  if (pathname.startsWith("/professor")) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const url = new URL("/login", origin);
    url.searchParams.set("callbackUrl", href);
    return NextResponse.redirect(url);
  }

  const match = ROUTE_TO_PERMISSION.find((r) => r.pattern.test(pathname));
  if (!match) return;

  const allowed = hasPermission(req.auth.user, "pages", "view", pathname);
  if (!allowed) return new Response("Forbidden", { status: 403 });
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|error|login).*)"],
};
