import type { PermissionCheck } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import {
  BookOpenIcon,
  ComputerIcon,
  HomeIcon,
  InfoIcon,
  ScanFaceIcon,
  UsersIcon,
  UserStarIcon,
  type LucideProps,
} from "lucide-react";
import type { Route } from "next";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type NavItem = {
  label: string;
  href: Route;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  allowed?: Role[];
  children?: NavItem[];
};

export const ROUTES: NavItem[] = [
  {
    label: "Home",
    href: "/",
    allowed: ["COORDINATOR", "PLA", "TA", "PROFESSOR"],
    icon: HomeIcon,
  },
  {
    label: "About",
    href: "/about",
    allowed: ["COORDINATOR", "PLA", "TA", "PROFESSOR"],
    icon: InfoIcon,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    allowed: ["COORDINATOR"],
    icon: UserStarIcon,
    children: [
      {
        label: "Create Term",
        href: "/dashboard/create-term",
        icon: ComputerIcon,
      },
      {
        label: "Manage Users",
        href: "/dashboard/manage-users",
        icon: UsersIcon,
      },
      {
        label: "Manage Courses",
        href: "/dashboard/manage-courses",
        icon: BookOpenIcon,
      },
      {
        label: "Solver",
        href: "/dashboard/solver",
        icon: ComputerIcon,
      },
      {
        label: "Permissions",
        href: "/dashboard/permissions",
        icon: ScanFaceIcon,
      },
    ],
  },
];

function matchesRoute(path: string, node: NavItem) {
  if (node.href === "/") {
    return path === "/";
  }

  if (path === node.href) {
    return true;
  }

  const normalized = node.href.endsWith("/") ? node.href : `${node.href}/`;
  return path.startsWith(normalized);
}

function flattenRoutes(nodes: NavItem[], parentAllowed?: Role[]): NavItem[] {
  const out: NavItem[] = [];
  for (const n of nodes) {
    const effectiveAllowed = n.allowed ?? parentAllowed ?? [];
    const self: NavItem = { ...n, allowed: effectiveAllowed };
    out.push(self);
    if (n.children?.length) {
      out.push(...flattenRoutes(n.children, effectiveAllowed));
    }
  }
  return out;
}

export function findRouteForPath(
  path: string,
  nodes: NavItem[],
  parentAllowed?: Role[],
): { route: NavItem; allowed: Role[] } | undefined {
  for (const n of nodes) {
    const allowed = n.allowed ?? parentAllowed ?? [];
    // Prefer the deepest match: check children first
    const childHit = n.children && findRouteForPath(path, n.children, allowed);
    if (childHit) return childHit;

    if (matchesRoute(path, n)) {
      return { route: n, allowed };
    }
  }
  return undefined;
}

export const FLAT_ROUTES = flattenRoutes(ROUTES);

export const canViewPage: PermissionCheck<"pages"> = (user, path) => {
  const hit = findRouteForPath(path, ROUTES);
  if (!hit) return false;
  const roles = user.roles ?? [];
  return hit.allowed.some((role) => roles.includes(role));
};
