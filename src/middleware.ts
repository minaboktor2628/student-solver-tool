import { auth } from "@/server/auth";
import { hasPermission, ROUTE_TO_PERMISSION } from "@/server/auth/permissions";

export default auth((req) => {
  const { origin, pathname } = req.nextUrl;

  if (pathname === "/login") return;
  if (!req.auth) return Response.redirect(new URL("/login", origin));

  const match = ROUTE_TO_PERMISSION.find((r) => r.pattern.test(pathname));
  if (!match) return;

  const allowed = hasPermission(req.auth.user, "pages", "view", pathname);
  if (!allowed) return new Response("Forbidden", { status: 403 });
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
