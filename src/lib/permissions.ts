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
import { db } from "@/server/db";
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
  studioEndpoint: {
    dataType: never;
    action: "view" | "call";
  };
  staffPreferenceForm: {
    dataType: { userId: string; isAllowedInActiveTerm: boolean };
    action: "viewActiveTerm" | "viewHistory" | "update" | "create";
  };
  professorPreferenceForm: {
    dataType: { userId: string; isAllowedInActiveTerm: boolean };
    action: "viewActiveTerm" | "viewHistory" | "update" | "create";
  };
};

const ROLES = {
  COORDINATOR: {
    pages: { view: canViewPage },
    studioEndpoint: { view: true, call: true },
    staffPreferenceForm: {
      create: true,
      update: true,
      viewActiveTerm: true,
      viewHistory: true,
    },
    professorPreferenceForm: {
      create: true,
      update: true,
      viewHistory: true,
      viewActiveTerm: true,
    },
  },
  PROFESSOR: {
    pages: { view: canViewPage },
    professorPreferenceForm: {
      create: (user, data) =>
        data.userId === user.id && data.isAllowedInActiveTerm,
      update: (user, data) =>
        data.userId === user.id && data.isAllowedInActiveTerm,
      viewActiveTerm: (user, data) =>
        data.userId === user.id && data.isAllowedInActiveTerm,
      viewHistory: (user, data) => data.userId === user.id,
    },
  },
  TA: {
    pages: { view: canViewPage },
    staffPreferenceForm: {
      create: (user, data) =>
        data.userId === user.id && data.isAllowedInActiveTerm,
      update: (user, data) =>
        data.userId === user.id && data.isAllowedInActiveTerm,
      viewActiveTerm: (user, data) =>
        data.userId === user.id && data.isAllowedInActiveTerm,
      viewHistory: (user, data) => data.userId === user.id,
    },
  },
  PLA: {
    pages: { view: canViewPage },
    staffPreferenceForm: {
      create: (user, data) =>
        data.userId === user.id && data.isAllowedInActiveTerm,
      update: (user, data) =>
        data.userId === user.id && data.isAllowedInActiveTerm,
      viewActiveTerm: (user, data) =>
        data.userId === user.id && data.isAllowedInActiveTerm,
      viewHistory: (user, data) => data.userId === user.id,
    },
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

export async function isUserAllowedInActiveTerm(
  userId: string,
): Promise<boolean> {
  const activeTerm = await db.term.findFirst({
    where: { active: true, allowedUsers: { some: { id: userId } } },
  });
  if (!activeTerm) return false;
  else return true; // if this term exists, then they are allowed
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
