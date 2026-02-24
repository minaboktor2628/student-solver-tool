"use client";
import { type ColumnDef } from "@tanstack/react-table";
import { type TermLetter } from "@prisma/client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TermTableRowActions } from "./term-table-row-actions";
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

export type TermRow = {
  id: string;
  year: number;
  termLetter: TermLetter;
  active: boolean;
  termStaffDueDate: Date;
  termProfessorDueDate: Date;
  _count: { sections: number; allowedUsers: number };
  name: string;
};

export type TermActions = {
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
  releaseAssignments: (id: string) => void;
  lockAll: (termId: string) => void;
  unlockAll: (termId: string) => void;
  releasePending: boolean;
  lockPending: boolean;
  unlockPending: boolean;
};

export const createColumns = (actions: TermActions): ColumnDef<TermRow>[] => [
  {
    accessorKey: "name",
    header: "Term Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue<string>("name")}</div>;
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
      return <TermTableRowActions term={term} actions={actions} />;
    },
  },
];

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
              : "This will activate the term and make it available for use. Student staff and professors will be affecting this term when filling out their preferences. Activating this term will deactivate all other terms."}
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
