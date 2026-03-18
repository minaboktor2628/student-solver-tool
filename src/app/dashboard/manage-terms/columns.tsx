"use client";
import { type ColumnDef } from "@tanstack/react-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TermTableRowActions } from "./term-table-row-actions";
import type { TermLetter } from "@/types/global";

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

export const createColumns = (): ColumnDef<TermRow>[] => [
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
      return <TermTableRowActions term={term} />;
    },
  },
];
