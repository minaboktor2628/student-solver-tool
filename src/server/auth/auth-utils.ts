import type { Role } from "@prisma/client";

export function rolesFromProfile(
  p: {
    email?: string;
    department?: string;
    title?: string;
    major?: string;
  },
  coordinatorEmails: string[],
): Role[] {
  const roles: Role[] = [];
  if (p.email && coordinatorEmails.includes(p.email)) {
    roles.push("COORDINATOR");
  }
  if (
    p.department === "Computer Science" &&
    /Professor|Instructor/.test(p.title ?? "")
  ) {
    roles.push("PROFESSOR");
  }
  if (p.department === "Student Employment") {
    if ((p.title ?? "").startsWith("Teaching Assistant")) {
      roles.push("TA");
    }
    if ((p.title ?? "").startsWith("Peer Learning Assistant - CS")) {
      roles.push("PLA");
    }
  }
  return roles;
}
