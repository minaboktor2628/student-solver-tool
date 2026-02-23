"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { GraduationCap } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table";
import type { RouterOutputs } from "@/trpc/react";
import { CourseTableRowAction } from "./course-table-row-actions";

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
  },
  {
    accessorKey: "professorName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Professor" />
    ),
    cell: ({ row }) => {
      const name = row.original.professorName;
      return (
        <div className="flex items-center gap-2">
          <GraduationCap className="text-muted-foreground h-4 w-4" />
          {name}
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
    id: "actions",
    cell: ({ row }) => {
      return <CourseTableRowAction course={row.original} />;
    },
  },
];
