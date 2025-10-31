import { describe, it, expect } from "vitest";
import type { User } from "next-auth";
import { hasPermission, allowedLinks } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const U = (roles: Role[]): User => ({ id: "u", email: "t@wpi.edu", roles });

describe("permissions", () => {
  it("coordinator can view /, /about, /dashboard and nested dashboard routes", () => {
    const u = U(["COORDINATOR"]);
    expect(hasPermission(u, "pages", "view", "/")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/about")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/dashboard")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/dashboard/solver")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/dashboard/solver/details")).toBe(
      true,
    );
    expect(hasPermission(u, "pages", "view", "/dashboard/permissions")).toBe(
      true,
    );
  });

  it("non-coordinator roles cannot view coordinator-only routes", () => {
    const u = U(["TA"]);
    expect(hasPermission(u, "pages", "view", "/")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/about")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/dashboard")).toBe(false);
    expect(hasPermission(u, "pages", "view", "/dashboard/solver")).toBe(false);
  });

  it("allowedLinks returns only links user can see", () => {
    const coord = U(["COORDINATOR"]);
    const ta = U(["TA"]);
    expect(allowedLinks(coord).map((l) => l.href)).toEqual([
      "/",
      "/about",
      "/dashboard",
      "/dashboard/solver",
      "/dashboard/permissions",
    ]);
    expect(allowedLinks(ta).map((l) => l.href)).toEqual(["/", "/about"]);
  });

  it("no roles => deny", () => {
    const u = U([]);
    expect(hasPermission(u, "pages", "view", "/")).toBe(false);
  });
});
