"use client";
import { api } from "@/trpc/react";
import { DataTable, DataTableColumnHeader } from "../data-table";
import { CopyButton } from "../copy-button";

export function AssignmentTable({ termId }: { termId: string }) {
  const [{ sections, allEmails }] =
    api.dashboard.getAssignments.useSuspenseQuery({
      termId,
    });

  return (
    <DataTable
      selectable
      data={sections}
      renderToolbarActions={() => {
        return (
          <CopyButton value={allEmails.join(", ")} variant="default" size="sm">
            Copy all emails
          </CopyButton>
        );
      }}
      columns={[
        {
          accessorKey: "title",
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Title" />
          ),
          cell: ({ row }) => (
            <p title={row.original.title} className="max-w-[24rem] truncate">
              {row.original.title}
            </p>
          ),
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
          cell: ({ row }) => {
            const content = row.original.plas.join("; ");
            return (
              <p title={content} className="max-w-[12rem] truncate">
                {content}
              </p>
            );
          },
        },
        {
          id: "tas",
          header: "TA's",
          accessorFn: (row) => row.tas.join("; "),
          cell: ({ row }) => {
            const content = row.original.tas.join("; ");
            return (
              <p title={content} className="max-w-[12rem] truncate">
                {content}
              </p>
            );
          },
        },
      ]}
    />
  );
}
