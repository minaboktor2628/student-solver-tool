"use client";
import { api } from "@/trpc/react";
import { DataTable, DataTableColumnHeader } from "../data-table";

export function AssignmentTable({ termId }: { termId: string }) {
  const [{ sections }] = api.dashboard.getAssignments.useSuspenseQuery({
    termId,
  });

  return (
    <DataTable
      selectable
      data={sections}
      columns={[
        {
          accessorKey: "title",
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Title" />
          ),
          cell: ({ row }) => row.original.title,
        },
        {
          accessorKey: "professor",
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Professor" />
          ),
          cell: ({ row }) => row.original.professor,
        },
        {
          accessorKey: "meetingPattern",
          header: "Meeting Pattern",
          cell: ({ row }) => row.original.meetingPattern,
        },
        {
          accessorKey: "academicLevel",
          header: "Academic Level",
          cell: ({ row }) => row.original.academicLevel,
        },
        {
          id: "plas",
          header: "PLA's",
          accessorFn: (row) => row.plas.join("; "),
          cell: ({ row }) => row.original.plas.join("; "),
        },
        {
          id: "tas",
          header: "TA's",
          accessorFn: (row) => row.tas.join("; "),
          cell: ({ row }) => row.original.tas.join("; "),
        },
      ]}
    />
  );
}
