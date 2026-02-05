"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, GraduationCap, Trash2 } from "lucide-react";
import type { Section, AcademicLevel } from "@prisma/client";

// Uses Prisma Section fields + API computed fields
export type Course = Pick<
  Section,
  | "id"
  | "termId"
  | "courseCode"
  | "courseTitle"
  | "courseSection"
  | "meetingPattern"
  | "description"
  | "enrollment"
  | "capacity"
  | "requiredHours"
> & {
  professorName: string;
  professorEmail: string;
  assignedStaff: number;
  term: string;
  academicLevel: AcademicLevel;
};

export const createColumns = (
  onEdit: (course: Course) => void,
  onDelete: (course: Course) => void,
): ColumnDef<Course>[] => [
  {
    accessorKey: "courseCode",
    header: "Course Code",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("courseCode")}</div>;
    },
  },
  {
    accessorKey: "courseTitle",
    header: "Course Title",
    cell: ({ row }) => {
      const title = row.getValue<string>("courseTitle");
      return (
        <div className="max-w-[200px] truncate" title={title}>
          {title}
        </div>
      );
    },
  },
  {
    accessorKey: "courseSection",
    header: "Section",
    cell: ({ row }) => {
      const section = row.getValue<string>("courseSection");
      return <div className="font-medium">{section}</div>;
    },
  },
  {
    accessorKey: "professorName",
    header: "Professor",
    cell: ({ row }) => {
      const name = row.getValue<string>("professorName");
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
    header: "Enrollment/Capacity",
    cell: ({ row }) => {
      const enrollment = row.getValue<number>("enrollment");
      const capacity = row.original.capacity;
      return `${enrollment}/${capacity}`;
    },
  },
  {
    accessorKey: "requiredHours",
    header: "Required Hours",
    cell: ({ row }) => {
      const hours = row.getValue<number>("requiredHours");
      return `${hours}h`;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const course = row.original;

      return (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(course)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(course)}
            className="text-destructive hover:text-destructive/80"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
