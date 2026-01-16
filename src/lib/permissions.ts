/*
 * Watch:
 * @link https://www.youtube.com/watch?v=5GG-VUvruzE
 * */

import {
  canViewPage,
  findRouteForPath,
  FLAT_ROUTES,
  ROUTES,
  type NavItem,
} from "@/lib/routes-to-permissions";
import type { Role } from "@prisma/client";
import type { User } from "next-auth";

export type PermissionCheck<Key extends keyof Permissions> =
  | boolean
  | ((user: User, data: Permissions[Key]["dataType"]) => boolean);

export type RolesWithPermissions = Record<
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
  GLA: {
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
export function matchRoute(path: string) {
  return findRouteForPath(path, ROUTES) ?? undefined;
}

export function allowedLinks(user: User | undefined) {
  if (!user) return [];
  // We evaluate permission against each item's own href.
  return FLAT_ROUTES.filter((r) =>
    hasPermission(user, "pages", "view", r.href),
  );
}
export function allowedTree(user: User): NavItem[] {
  if (!user) return [];

  function filterNodes(nodes: NavItem[], parentAllowed?: Role[]): NavItem[] {
    const out: NavItem[] = [];

    for (const n of nodes) {
      const effectiveAllowed = n.allowed ?? parentAllowed ?? [];
      const canSeeThis = hasPermission(user, "pages", "view", n.href);

      const filteredChildren = n.children?.length
        ? filterNodes(n.children, effectiveAllowed)
        : [];

      // include node if user can see it OR any child is visible
      if (canSeeThis || filteredChildren.length > 0) {
        out.push({
          ...n,
          allowed: effectiveAllowed,
          children: filteredChildren,
        });
      }
    }

    return out;
  }

  return filterNodes(ROUTES);
}
