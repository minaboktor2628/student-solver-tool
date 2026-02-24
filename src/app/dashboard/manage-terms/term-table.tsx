"use client";
import { api } from "@/trpc/react";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createColumns, type TermRow } from "./columns";

// TODO: make this paginated
export function TermTable() {
  const [termStats] = api.term.getTermStats.useSuspenseQuery();

  const utils = api.useUtils();
  const deleteTerm = api.term.deleteTerm.useMutation({
    onSuccess: async () => {
      await utils.term.getTermStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: async () => {
      await utils.term.invalidate();
    },
  });

  const activateTerm = api.term.activateTerm.useMutation({
    onSuccess: async () => {
      await utils.term.getTermStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: async () => {
      await utils.term.invalidate();
    },
  });

  const deactivateTerm = api.term.deactivateTerm.useMutation({
    onSuccess: async () => {
      await utils.term.getTermStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: async () => {
      await utils.term.invalidate();
    },
  });

  const releaseAssignmentsMutation = api.term.releaseAssignments.useMutation({
    onSuccess: async (res) => {
      if (res?.success) {
        toast.success("Assignments released.");
        // invalidate relevant queries to pick up published state
        await utils.term.getTermStats.invalidate();
        await utils.term.getAllTerms.invalidate();
      } else {
        toast.error("Failed to release assignments");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
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

  const columns = createColumns(
    (id) => activateTerm.mutate({ id }),
    (id) => deactivateTerm.mutate({ id }),
    (id) => deleteTerm.mutate({ id }),
    {
      releaseAssignments: (id: string) =>
        releaseAssignmentsMutation.mutate({ id }),
      lockAll: (termId: string) => lockAllMutation.mutate({ termId }),
      unlockAll: (termId: string) => unlockAllMutation.mutate({ termId }),
      releasePending: releaseAssignmentsMutation.isPending,
      lockPending: lockAllMutation.isPending,
      unlockPending: unlockAllMutation.isPending,
    },
  );

  const rows: TermRow[] = (termStats ?? []).map((t) => ({
    ...(t as Omit<TermRow, "name">),
    name: `${t.termLetter} ${t.year}`,
  }));

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={columns}
          data={rows}
          toolbarProps={{
            searchColumnId: "name",
            searchPlaceholder: "Filter terms...",
          }}
        />
      </CardContent>
    </Card>
  );
}
