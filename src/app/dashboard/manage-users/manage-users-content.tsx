"use client";

import { Role } from "@prisma/client";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { RefreshCw, Lock, Unlock, RefreshCwIcon } from "lucide-react";

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

export type UserTableRow =
  RouterOutputs["staff"]["getAllUsers"]["users"][number];

export default function ManageUsersContent() {
  const { selectedTerm } = useTerm();

  if (!selectedTerm) throw new Error("No selected term!");

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

  const handleLockAll = () => {
    lockAllMutation.mutate({ termId: selectedTerm.id });
  };

  const handleUnlockAll = () => {
    unlockAllMutation.mutate({ termId: selectedTerm.id });
  };

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
            <Button
              onClick={() => usersApi.refetch()}
              disabled={usersApi.isRefetching}
              variant="outline"
              size="sm"
            >
              <RefreshCwIcon
                className={usersApi.isRefetching ? "animate-spin" : ""}
              />{" "}
              Re-fetch
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            selectable
            toolbarProps={{
              searchPlaceholder: "Search by name...",
              searchColumnIds: ["name", "email"],
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
            renderFooterExtras={(table) => {
              // TODO: use the tables selected rows to only lock/unlock the selected people
              return (
                <div className="ml-auto flex gap-2">
                  <Button
                    onClick={handleLockAll}
                    variant="destructive"
                    className="gap-2"
                    disabled={lockAllMutation.isPending}
                  >
                    {lockAllMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    Lock All
                  </Button>
                  <Button
                    onClick={handleUnlockAll}
                    variant="outline"
                    className="gap-2"
                    disabled={unlockAllMutation.isPending}
                  >
                    {unlockAllMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                    Unlock All
                  </Button>
                </div>
              );
            }}
            renderToolbarActions={(table) => {
              return <UploadAllowedUsersForm termId={selectedTerm.id} />;
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
