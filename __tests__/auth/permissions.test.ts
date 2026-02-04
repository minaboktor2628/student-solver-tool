import { describe, it, expect } from "vitest";
import type { User } from "next-auth";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const U = (roles: Role[]): User => ({
  id: "u",
  email: "t@wpi.edu",
  roles,
  allowedInActiveTerm: true,
});

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

  it("only coordinators can call /api/studio", () => {
    const coord = U(["COORDINATOR"]);
    const ta = U(["TA"]);
    const pla = U(["PLA"]);
    const prof = U(["PROFESSOR"]);
    const noRoles = U([]);

    expect(hasPermission(coord, "studioEndpoint", "call", undefined)).toBe(
      true,
    );

    expect(hasPermission(ta, "studioEndpoint", "call", undefined)).toBe(false);
    expect(hasPermission(pla, "studioEndpoint", "call", undefined)).toBe(false);
    expect(hasPermission(prof, "studioEndpoint", "call", undefined)).toBe(
      false,
    );
    expect(hasPermission(noRoles, "studioEndpoint", "call", undefined)).toBe(
      false,
    );
  });

  it("no roles => deny", () => {
    const u = U([]);
    expect(hasPermission(u, "pages", "view", "/")).toBe(false);
  });
});
