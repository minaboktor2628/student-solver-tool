"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import type { RouterOutputs } from "@/trpc/react";
import { CourseTableRowAction } from "./course-table-row-actions";
import { CopyButton } from "@/components/copy-button";
import { unknownProfessorName } from "@/lib/constants";
import { TriangleAlertIcon } from "lucide-react";
import { humanizeKey } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type CourseRow =
  RouterOutputs["courses"]["getAllCourses"]["courses"][number];

export const createColumns = (): ColumnDef<CourseRow>[] => [
  {
    accessorKey: "courseTitle",
    accessorFn: (row) => row.courseTitle,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const fullTitle = `${row.original.courseCode}-${row.original.courseSection} - ${row.original.courseTitle}`;

      return <div title={fullTitle}>{fullTitle}</div>;
    },
    filterFn: (row, _, filterValue) => {
      const term = String(filterValue ?? "").toLowerCase();
      if (!term) return true;

      const name = (row.original.professorName ?? "").toLowerCase();
      const email = (row.original.professorEmail ?? "").toLowerCase();
      const title =
        `${row.original.courseCode}-${row.original.courseSection} - ${row.original.courseTitle}`.toLowerCase();

      return (
        name.includes(term) || email.includes(term) || title.includes(term)
      );
    },
  },
  {
    accessorKey: "professorName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Professor" />
    ),
    cell: ({ row }) => {
      const { professorName, professorEmail } = row.original;
      const isUnsetProfessor = professorName === unknownProfessorName;

      return (
        <div className="flex items-center gap-2">
          {isUnsetProfessor ? (
            <p
              title="This course does not have a professor assigned to it."
              className="ml-1 flex flex-row gap-2"
            >
              <TriangleAlertIcon className="text-destructive size-5" />{" "}
              <span className="text-muted-foreground line-through">
                {professorName}
              </span>
            </p>
          ) : (
            <>
              <CopyButton value={professorEmail} title="Copy email" />
              {professorName}
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "enrollment",
    accessorFn: (row) => row.enrollment,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Enrollment" />
    ),
    cell: ({ row }) => {
      const { enrollment, capacity } = row.original;
      return (
        <p>
          {enrollment}/{capacity}
        </p>
      );
    },
  },
  {
    accessorKey: "requiredHours",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Required hours" />
    ),
    cell: ({ row }) => {
      const hours = row.original.requiredHours;
      return `${hours}h`;
    },
  },
  {
    accessorKey: "academicLevel",
    accessorFn: (row) => row.academicLevel,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Academic level" />
    ),
    cell: ({ row }) => {
      const { academicLevel } = row.original;
      return <Badge>{humanizeKey(academicLevel)}</Badge>;
    },
    filterFn: "equals",
  },
  // Derived, hidden column used *only* for faceted filtering
  {
    id: "hasProfessor",
    accessorFn: (row) =>
      !!row.professorName && row.professorName !== unknownProfessorName,
    // never export
    meta: { export: false },
    enableHiding: false,
    // we don't actually render this anywhere
    cell: () => null,
    header: () => null,
    filterFn: (row, columnId, filterValue) => {
      const values = (filterValue ?? []) as string[];
      if (!values.length) return true;

      const hasProfessor = row.getValue<boolean>(columnId);

      const wantsAssigned = values.includes("assigned");
      const wantsUnassigned = values.includes("unassigned");

      if (hasProfessor && wantsAssigned) return true;
      if (!hasProfessor && wantsUnassigned) return true;

      return false;
    },
  },
  {
    id: "actions",
    meta: { export: false },
    cell: ({ row }) => {
      return <CourseTableRowAction course={row.original} />;
    },
  },
];
