"use client";

import { api } from "@/trpc/react";

import { DataTable } from "@/components/data-table";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createColumns } from "./columns";
import { TermCombobox, useTerm } from "@/components/term-combobox";
import { SyncSectionsForm } from "@/components/dashboard/sync-sections-form";
import { AcademicLevel } from "@prisma/client";
import { humanizeKey } from "@/lib/utils";
import { NoTermsAlert } from "@/components/dashboard/no-term-alert";
import { RefetchButton } from "@/components/refetch-button";

export default function ManageCoursesContent() {
  const { selectedTerm } = useTerm();

  if (!selectedTerm) return <NoTermsAlert />;

  const [{ courses }, courseApi] = api.courses.getAllCourses.useSuspenseQuery({
    termId: selectedTerm?.id,
  });

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-foreground text-3xl font-bold">
              Manage Courses
            </h1>
            <p className="text-muted-foreground text-sm">
              Managing courses for {selectedTerm.label} term
            </p>
          </div>
        </div>
        <TermCombobox />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>
            Add, edit, and remove course for the selected term.
          </CardDescription>
          <CardAction>
            <RefetchButton query={courseApi} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={createColumns()}
            data={courses}
            selectable
            toolbarProps={{
              searchPlaceholder: "Filter courses...",
              searchColumnId: "courseTitle",
              facetedFilters: [
                {
                  columnId: "hasProfessor",
                  title: "Professor assignment",
                  options: [
                    { label: "Has professor", value: "assigned" },
                    { label: "No professor", value: "unassigned" },
                  ],
                },
                {
                  columnId: "academicLevel",
                  title: "Academic level",
                  options: Object.values(AcademicLevel).map((value) => ({
                    value,
                    label: humanizeKey(value),
                  })),
                },
              ],
            }}
            renderToolbarActions={() => <SyncSectionsForm {...selectedTerm} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
