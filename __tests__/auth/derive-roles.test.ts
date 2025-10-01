import { describe, it, expect } from "vitest";
import { rolesFromProfile } from "@/server/auth/auth-utils";
import { vi } from "vitest";

// Minimal shim so next-auth's import succeeds
vi.mock("next/server", () => {
  return {
    // next-auth usually only touches env via this import; stubs are fine
    headers: () => new Headers(),
    // cookies: () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
    // NextResponse: { next: () => ({}), redirect: () => ({}), json: (x) => x },
    NextRequest: class {},
  };
});

describe("rolesFromProfile", () => {
  it("coordinator list wins", () => {
    const roles = rolesFromProfile({ email: "alice@wpi.edu" }, [
      "alice@wpi.edu",
    ]);
    expect(roles).toContain("COORDINATOR");
  });

  it("TA & PLA detection", () => {
    expect(
      rolesFromProfile(
        { department: "Student Employment", title: "Teaching Assistant" },
        [],
      ),
    ).toEqual(["TA"]);
    expect(
      rolesFromProfile(
        {
          department: "Student Employment",
          title: "Peer Learning Assistant - CS AY 25-26",
        },
        [],
      ),
    ).toEqual(["PLA"]);
  });
});

describe("professor detection", () => {
  // why are there so many variations :(
  // this isn't even all of them
  const titles = [
    "Professor",
    "Assistant Teaching Professor",
    "Instructor",
    "Associate Teaching Professor",
    "Adjunct Instructor/Lecturer",
    "Associate Professor",
    "Affiliate Professor",
    "Professor & Department Head",
    "Professor of Teaching",
    "Professor, Computer Science, Program Head, Data Science", // what the hell
    "Associate Dean of Arts & Sciences and Harold L. Jurist ’61 and Heather E. Jurist Dean’s Professor of Computer Science", // thanks prof Ruiz
  ] as const;

  it.each(titles)('flags "%s" as PROFESSOR', (title) => {
    expect(
      rolesFromProfile({ department: "Computer Science", title }, []),
    ).toContain("PROFESSOR");
  });

  it.each(titles)('NOT professor if department != CS ("%s")', (title) => {
    expect(
      rolesFromProfile({ department: "Mechanical Engineering", title }, []),
    ).not.toContain("PROFESSOR");
  });
});
