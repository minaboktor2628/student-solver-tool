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

  const publishTermMutation = api.term.publishTerm.useMutation({
    onSuccess: async () => {
      toast.success("Term published.");
      await Promise.all([
        utils.dashboard.invalidate(),
        utils.term.getTermStats.invalidate(),
        utils.term.getAllTerms.invalidate(),
        utils.term.invalidate(),
      ]);
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

  const actions = {
    onActivate: (id: string) => activateTerm.mutate({ id }),
    onDeactivate: (id: string) => deactivateTerm.mutate({ id }),
    onDelete: (id: string) => deleteTerm.mutate({ id }),
    publishTerm: (id: string) => publishTermMutation.mutate({ id }),
    lockAll: (termId: string) => lockAllMutation.mutate({ termId }),
    unlockAll: (termId: string) => unlockAllMutation.mutate({ termId }),
    publishPending: publishTermMutation.isPending,
    lockPending: lockAllMutation.isPending,
    unlockPending: unlockAllMutation.isPending,
  };

  const columns = createColumns(actions);

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
