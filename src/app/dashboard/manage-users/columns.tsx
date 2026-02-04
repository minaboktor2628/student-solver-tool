"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Trash2, Lock, Unlock } from "lucide-react";
import { Role, type User as PrismaUser } from "@prisma/client";

// Uses Prisma User fields + API computed fields (roles transformed, locked/hasPreference added)
export type User = Pick<PrismaUser, "id" | "name" | "email" | "hours"> & {
  roles: Role[]; // Array of Role enum values from UserRole relation
  locked: boolean; // Computed from staffPreferences.canEdit
  hasPreference: boolean; // Computed from staffPreferences existence
};

const ROLE_COLORS: Record<Role, string> = {
  PLA: "bg-primary/20 text-primary border-primary/30",
  TA: "bg-success/20 text-success border-success/30",
  GLA: "bg-accent/20 text-accent border-accent/30",
  PROFESSOR: "bg-violet-200 text-violet-900 border-violet-300",
  COORDINATOR: "bg-warning/20 text-warning border-warning/30",
};

const getRoleBadgeClass = (role: Role): string => {
  const color = ROLE_COLORS[role];
  return color ?? "bg-muted/20 text-muted-foreground border-muted/30";
};

export const createColumns = (
  onEdit: (user: User) => void,
  onDelete: (user: User) => void,
  onToggleLock?: (user: User) => void,
  activeTerm?: string | null,
): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Mail className="text-muted-foreground h-4 w-4" />
          {row.getValue("email")}
        </div>
      );
    },
  },
  {
    accessorKey: "roles",
    header: "Role",
    cell: ({ row }) => {
      const roles = row.getValue<Role[]>("roles");
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <Badge
              key={role}
              variant="outline"
              className={getRoleBadgeClass(role)}
            >
              {role}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value: string) => {
      const roles = row.getValue<Role[]>(id);
      return roles.some((role) =>
        role.toLowerCase().includes(value.toLowerCase()),
      );
    },
  },
  {
    accessorKey: "locked",
    header: "Status",
    cell: ({ row }) => {
      const locked = row.getValue<boolean>("locked");
      const hasPreference = row.original.hasPreference;

      if (!hasPreference) {
        return (
          <Badge variant="outline" className="text-xs">
            No Preference
          </Badge>
        );
      }

      return (
        <Badge variant={locked ? "destructive" : "success"} className="text-xs">
          {locked ? (
            <>
              <Lock className="mr-1 h-3 w-3" />
              Locked
            </>
          ) : (
            <>
              <Unlock className="mr-1 h-3 w-3" />
              Unlocked
            </>
          )}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const user = row.original;
      const isCoordinator = user.roles.includes(Role.COORDINATOR);
      const canToggleLock = onToggleLock && activeTerm;

      return (
        <div className="flex justify-end gap-2">
          {canToggleLock && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleLock(user)}
              title={user.locked ? "Unlock user" : "Lock user"}
            >
              {user.locked ? (
                <Unlock className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            disabled={isCoordinator}
            title={isCoordinator ? "Cannot edit coordinator" : "Edit user"}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user)}
            disabled={isCoordinator}
            title={isCoordinator ? "Cannot delete coordinator" : "Delete user"}
            className="text-destructive hover:text-destructive/80"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
