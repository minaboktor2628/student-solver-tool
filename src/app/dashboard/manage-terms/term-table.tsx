"use client";
import { api } from "@/trpc/react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UploadAllowedUsersForm } from "@/components/dashboard/upload-allowed-users-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { SyncSectionsForm } from "./sync-sections-form";

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

  // Build columns for DataTable
  type TermRow = (typeof termStats)[number];

  const createColumns = (
    onActivate: (id: string) => void,
    onDeactivate: (id: string) => void,
    onDelete: (id: string) => void,
  ): ColumnDef<TermRow>[] => [
    {
      id: "name",
      header: "Term Name",
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="font-medium">
            {t.termLetter} {t.year}
          </div>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "default" : "outline"}>
          {row.original.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "sections",
      header: "Number of Sections",
      cell: ({ row }) => row.original._count.sections,
    },
    {
      id: "allowedUsers",
      header: "Allowed Users",
      cell: ({ row }) => row.original._count.allowedUsers,
    },
    {
      accessorKey: "termStaffDueDate",
      header: "Staff Due Date",
      cell: ({ row }) => row.original.termStaffDueDate.toLocaleDateString(),
    },
    {
      accessorKey: "termProfessorDueDate",
      header: "Professor Due Date",
      cell: ({ row }) => row.original.termProfessorDueDate.toLocaleDateString(),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const term = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontalIcon />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <UploadAllowedUsersForm termId={term.id}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Upload users
                  </DropdownMenuItem>
                </UploadAllowedUsersForm>
                <SyncSectionsForm
                  year={term.year}
                  termLetter={term.termLetter}
                />
                <ActivateDeactivateButton
                  active={term.active}
                  onActivate={() => onActivate(term.id)}
                  onDeactivate={() => onDeactivate(term.id)}
                />
                <DropdownMenuSeparator />
                <DeleteButton onClick={() => onDelete(term.id)} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const columns = createColumns(
    (id) => activateTerm.mutate({ id }),
    (id) => deactivateTerm.mutate({ id }),
    (id) => deleteTerm.mutate({ id }),
  );

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={columns}
          data={termStats ?? []}
          toolbarProps={{
            searchColumnId: "name",
            searchPlaceholder: "Filter terms...",
          }}
        />
      </CardContent>
    </Card>
  );
}

function ActivateDeactivateButton({
  active,
  onActivate,
  onDeactivate,
}: {
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const isDeactivate = active;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {isDeactivate ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDeactivate ? "Deactivate term?" : "Activate term?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeactivate
              ? "This will deactivate the term and prevent it from being used."
              : "This will activate the term and make it available for use. Student staff and professors will be affecting this term when filling out thier preferences. Activating this term will deactivate all other term."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={isDeactivate ? onDeactivate : onActivate}>
            {isDeactivate ? "Deactivate" : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => e.preventDefault()}
        >
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete term?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the term
            and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onClick}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
