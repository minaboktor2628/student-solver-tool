import { describe, it, expect } from "vitest";
import type { User } from "next-auth";
import { hasPermission, allowedLinks } from "@/server/auth/permissions";
import type { Role } from "@prisma/client";

const U = (roles: Role[]): User => ({ id: "u", email: "t@wpi.edu", roles });

describe("permissions", () => {
  it("coordinator can view /, /validate, /docs", () => {
    const u = U(["COORDINATOR"]);
    expect(hasPermission(u, "pages", "view", "/")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/validate")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/validate/nested")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/docs/ci-docs")).toBe(true);
  });

  it("TA can only view /", () => {
    const u = U(["TA"]);
    expect(hasPermission(u, "pages", "view", "/")).toBe(true);
    expect(hasPermission(u, "pages", "view", "/validate")).toBe(false);
    expect(hasPermission(u, "pages", "view", "/docs")).toBe(false);
  });

  it("allowedLinks returns only links user can see", () => {
    const coord = U(["COORDINATOR"]);
    const ta = U(["TA"]);
    expect(allowedLinks(coord).map((l) => l.href)).toEqual(
      expect.arrayContaining(["/", "/validate", "/docs"]),
    );
    expect(allowedLinks(ta).map((l) => l.href)).toEqual(["/"]);
  });

  it("no roles => deny", () => {
    const u = U([]);
    expect(hasPermission(u, "pages", "view", "/")).toBe(false);
  });
});
