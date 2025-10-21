/*
 * Watch:
 * @link https://www.youtube.com/watch?v=5GG-VUvruzE
 * */

import type { Role } from "@prisma/client";
import type { Route } from "next";
import type { User } from "next-auth";

type PermissionCheck<Key extends keyof Permissions> =
  | boolean
  | ((user: User, data: Permissions[Key]["dataType"]) => boolean);

type RolesWithPermissions = Record<
  Role,
  Partial<{
    [Key in keyof Permissions]: Partial<
      Record<Permissions[Key]["action"], PermissionCheck<Key>>
    >;
  }>
>;

type Permissions = {
  pages: {
    dataType: string;
    action: "view";
  };
};

export const ROUTE_TO_PERMISSION: Array<{
  pattern: RegExp;
  label: string;
  href: Route;
  allowed: Role[];
}> = [
  {
    pattern: /^\/$/,
    label: "Home",
    href: "/",
    allowed: ["COORDINATOR", "PLA", "TA", "PROFESSOR"],
  },
  {
    pattern: /^\/validate(?:\/.*)?$/,
    label: "Validate",
    href: "/validate",
    allowed: ["COORDINATOR"],
  },
  {
    pattern: /^\/docs(?:\/.*)?$/,
    label: "Docs",
    href: "/docs" as Route,
    allowed: ["COORDINATOR"],
  },
  {
    pattern: /^\/dashboard(?:\/.*)?$/,
    label: "Dashboard",
    href: "/dashboard",
    allowed: ["COORDINATOR"],
  },
];

export const canViewPage: PermissionCheck<"pages"> = (user, href) => {
  const route = ROUTE_TO_PERMISSION.find((r) => r.pattern.test(href));
  if (!route) return false;
  const roles = user.roles ?? [];
  return route.allowed.some((a) => roles.includes(a));
};

const ROLES = {
  COORDINATOR: {
    pages: { view: canViewPage },
  },
  PROFESSOR: {
    pages: { view: canViewPage },
  },
  TA: {
    pages: { view: canViewPage },
  },
  PLA: {
    pages: { view: canViewPage },
  },
} as const satisfies RolesWithPermissions;

export function hasPermission<Resource extends keyof Permissions>(
  user: User,
  resource: Resource,
  action: Permissions[Resource]["action"],
  data?: Permissions[Resource]["dataType"],
): boolean {
  // if user has no roles, early deny
  if (!user.roles?.length) return false;

  return user.roles.some((role) => {
    const permission = (ROLES as RolesWithPermissions)[role][resource]?.[
      action
    ];
    if (permission == null) return false;

    if (typeof permission === "boolean") return permission;
    return data != null && permission(user, data);
  });
}

export function allowedLinks(user: User | undefined) {
  if (!user) return [];
  return ROUTE_TO_PERMISSION.filter((r) =>
    hasPermission(user, "pages", "view", r.href),
  ).map(({ href, label }) => ({ href, label }));
}
