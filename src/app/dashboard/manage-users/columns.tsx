"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Lock, Unlock, Settings2Icon } from "lucide-react";
import { type Role } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAssistant, isProfessor } from "@/lib/utils";
import ProfessorPreferenceForm from "@/components/professor/preference-form/professor-preference-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GlobalSuspense } from "@/components/global-suspense";
import MultiStepFormModal from "@/components/staff/MultiStepForm/multi-step-form-modal";
import type { User as NextUser } from "next-auth";
import { CopyButton } from "@/components/copy-button";

export type User = NextUser & {
  locked: boolean; // Computed from staffPreferences.canEdit
  hasPreference: boolean; // Computed from staffPreferences existence
};

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

export const createColumns = (
  onEdit: (user: User) => void,
  onDelete: (user: User) => void,
  onToggleLock: (user: User) => void,
  activeTermId: string,
): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.name}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.original.email ?? "";
      const name = row.original.name ?? "";
      return (
        <div className="flex items-center gap-2">
          <CopyButton value={email} title="Copy email" />
          <Button
            asChild
            variant="link"
            className="text-primary-foreground p-0"
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
    filterFn: (row, value: string) => {
      const roles = row.original.roles ?? [];
      return roles.some((role) =>
        role.toLowerCase().includes(value.toLowerCase()),
      );
    },
  },
  {
    accessorKey: "locked",
    header: "Status",
    cell: ({ row }) => {
      const locked = row.original.locked;
      const hasPreference = row.original.hasPreference;

      // TODO: does it matter that they have no preferences?
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
  },
  {
    id: "actions",
    header: () => <p className="text-right">Actions</p>,
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {isProfessor(user) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Settings2Icon className="size-4" /> Edit preferences
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-6xl">
                    <DialogHeader>
                      <DialogTitle>Edit preferences as {user.name}</DialogTitle>
                    </DialogHeader>
                    <GlobalSuspense>
                      <div className="no-scrollbar -mx-4 max-h-[70vh] overflow-y-auto px-4">
                        <ProfessorPreferenceForm
                          userId={user.id}
                          termId={activeTermId}
                        />
                      </div>
                    </GlobalSuspense>
                  </DialogContent>
                </Dialog>
              )}
              {isAssistant(user) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Settings2Icon className="size-4" /> Edit preferences
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-6xl">
                    <DialogHeader>
                      <DialogTitle>Edit preferences as {user.name}</DialogTitle>
                    </DialogHeader>
                    <GlobalSuspense>
                      <div className="no-scrollbar -mx-4 max-h-[70vh] overflow-y-auto px-4">
                        <MultiStepFormModal
                          userId={user.id}
                          termId={activeTermId}
                          inline
                        />
                      </div>
                    </GlobalSuspense>
                  </DialogContent>
                </Dialog>
              )}
              <DropdownMenuItem onClick={() => onToggleLock(user)}>
                {user.locked ? (
                  <>
                    <Unlock className="h-4 w-4" /> Unlock preferences
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Lock preferences
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4" /> Edit user
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(user)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
