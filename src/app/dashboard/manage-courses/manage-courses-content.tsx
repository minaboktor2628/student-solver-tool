"use client";

import { api } from "@/trpc/react";

import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function ManageCoursesContent() {
  const { selectedTerm } = useTerm();

  if (!selectedTerm) throw new Error("No selected term!");

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
            <Button
              onClick={() => courseApi.refetch()}
              disabled={courseApi.isRefetching}
              variant="outline"
              size="sm"
            >
              <RefreshCwIcon
                className={courseApi.isRefetching ? "animate-spin" : ""}
              />{" "}
              Re-fetch
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={createColumns()}
            data={courses}
            toolbarProps={{ searchColumnId: "courseTitle" }}
            renderToolbarActions={() => <SyncSectionsForm {...selectedTerm} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
