"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, CheckIcon, XIcon } from "lucide-react";
import type { Role } from "@prisma/client";

import { CopyButton } from "@/components/copy-button";
import { DataTableColumnHeader } from "@/components/data-table";
import type { UserTableRow } from "./manage-users-content";
import { UserTableRowAction } from "./user-table-row-actions";

const ROLE_COLORS: Record<Role, string> = {
  PLA: "bg-primary/20 text-primary border-primary/30",
  TA: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  GLA: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  PROFESSOR: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  COORDINATOR: "bg-warning/20 text-warning border-warning/30",
} as const;

const getRoleBadgeClass = (role: Role): string => {
  return ROLE_COLORS[role];
};

// TODO: add locked pref col, has pref cols

export const createColumns = (
  activeTermId: string,
): ColumnDef<UserTableRow>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.name}</div>;
    },
    filterFn: (row, _, filterValue) => {
      const term = String(filterValue ?? "").toLowerCase();
      if (!term) return true;

      const name = (row.getValue<string>("name") ?? "").toLowerCase();
      const email = (row.getValue<string>("email") ?? "").toLowerCase();

      return name.includes(term) || email.includes(term);
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.original.email ?? "";
      const name = row.original.name ?? "";
      return (
        <div className="flex items-center gap-2">
          <CopyButton value={email} title="Copy email" />
          <Button
            asChild
            variant="link"
            className="text-foreground p-0"
            title={`Send email to ${name}`}
          >
            <a href={`mailto:${email}`}>{email}</a>
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "roles",
    header: "Role",
    cell: ({ row }) => {
      const roles = row.original.roles ?? [];
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
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "hasPreference",
    header: "Preference form status",
    filterFn: (row, columnId, filterValue) => {
      const selected = filterValue as string[] | undefined;
      if (!selected || selected.length === 0) return true;

      const value = row.getValue<boolean>(columnId);
      const valueAsString = value ? "true" : "false";
      return selected.includes(valueAsString);
    },
    cell: ({ row }) => {
      const hasPreference = row.original.hasPreference;

      return (
        <Badge
          variant={hasPreference ? "success" : "destructive"}
          className="text-xs"
        >
          {hasPreference ? (
            <>
              <CheckIcon /> Submitted
            </>
          ) : (
            <>
              <XIcon /> Not submitted
            </>
          )}
        </Badge>
      );
    },
  },
  {
    accessorKey: "locked",
    header: "Preference form access",
    cell: ({ row }) => {
      const locked = row.original.locked;

      return (
        <Badge variant={locked ? "destructive" : "success"} className="text-xs">
          {locked ? (
            <>
              <Lock className="mr-1 h-3 w-3" /> Locked
            </>
          ) : (
            <>
              <Unlock className="mr-1 h-3 w-3" /> Unlocked
            </>
          )}
        </Badge>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      const selected = filterValue as string[] | undefined;
      if (!selected || selected.length === 0) return true;

      const value = row.getValue<boolean>(columnId);
      const valueAsString = value ? "true" : "false";
      return selected.includes(valueAsString);
    },
  },
  {
    id: "actions",
    meta: { export: false },
    cell: ({ row }) => (
      <UserTableRowAction termId={activeTermId} user={row.original} />
    ),
  },
];
