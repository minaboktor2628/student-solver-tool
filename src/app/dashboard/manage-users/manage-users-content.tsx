"use client";

import { Role } from "@prisma/client";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { RefreshCw, Lock, Unlock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { createColumns } from "./columns";
import { UploadAllowedUsersForm } from "@/components/dashboard/upload-allowed-users-form";
import { humanizeKey } from "@/lib/utils";
import { TermCombobox, useTerm } from "@/components/term-combobox";
import { NoTermsAlert } from "@/components/dashboard/no-term-alert";
import { RefetchButton } from "@/components/refetch-button";

export type UserTableRow =
  RouterOutputs["staff"]["getAllUsers"]["users"][number];

export default function ManageUsersContent() {
  const { selectedTerm } = useTerm();

  if (!selectedTerm) return <NoTermsAlert />;

  const utils = api.useUtils();
  const [{ users }, usersApi] = api.staff.getAllUsers.useSuspenseQuery({
    termId: selectedTerm.id,
  });

  const lockAllMutation = api.staff.lockAllStaffPreferences.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unlockAllMutation = api.staff.unlockAllStaffPreferences.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleLockAll(userIds?: string[]) {
    if (!selectedTerm) return;
    lockAllMutation.mutate({ termId: selectedTerm.id, userIds });
  }

  function handleUnlockAll(userIds?: string[]) {
    if (!selectedTerm) return;
    unlockAllMutation.mutate({ termId: selectedTerm.id, userIds });
  }

  const columns = createColumns(selectedTerm.id);

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-foreground text-3xl font-bold">Manage Users</h1>
            <p className="text-muted-foreground text-sm">
              Managing users for {selectedTerm.label} term
            </p>
          </div>
        </div>
        <TermCombobox />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage staff and professors in the system. You can lock/unlock the
            preference forms for individuals here.
          </CardDescription>
          <CardAction>
            <RefetchButton query={usersApi} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            selectable
            toolbarProps={{
              searchPlaceholder: "Search by name...",
              searchColumnId: "name",
              facetedFilters: [
                {
                  columnId: "roles",
                  title: "Roles",
                  options: Object.values(Role).map((value) => ({
                    value,
                    label: humanizeKey(value),
                  })),
                },
                {
                  columnId: "hasPreference",
                  title: "Status",
                  options: [
                    { value: "false", label: "Not submitted" },
                    { value: "true", label: "Submitted" },
                  ],
                },
                {
                  columnId: "locked",
                  title: "Locked",
                  options: [
                    { value: "false", label: "Unlocked" },
                    { value: "true", label: "Locked" },
                  ],
                },
              ],
            }}
            renderToolbarActions={(table) => {
              const selectedIds = table
                .getSelectedRowModel()
                .rows.map((r) => r.original.id);

              const effectiveUserIds =
                selectedIds.length > 0 ? selectedIds : undefined;

              return (
                <div className="ml-auto flex gap-2">
                  <UploadAllowedUsersForm termId={selectedTerm.id} />
                  <Button
                    onClick={() => handleLockAll(effectiveUserIds)}
                    variant="destructive"
                    className="gap-2"
                    disabled={lockAllMutation.isPending}
                  >
                    {lockAllMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    {selectedIds.length > 0 ? "Lock selected" : "Lock all"}
                  </Button>

                  <Button
                    onClick={() => handleUnlockAll(effectiveUserIds)}
                    variant="outline"
                    className="gap-2"
                    disabled={unlockAllMutation.isPending}
                  >
                    {unlockAllMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                    {selectedIds.length > 0 ? "Unlock selected" : "Unlock all"}
                  </Button>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
