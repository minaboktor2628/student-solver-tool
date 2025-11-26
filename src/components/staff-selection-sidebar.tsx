"use client";
import { useState } from "react";
import { Input } from "./ui/input";
import { StaffItem } from "./staff-item";
import { api } from "@/trpc/react";
import { Draggable } from "./draggable";
import { Droppable } from "./droppable";

export const STAFF_SIDEBAR_ID = "StaffSelectionSidebar" as const;

export type StaffSelectionSidebarProps = {
  sectionId: string;
};

export function StaffSelectionSidebar({
  sectionId,
}: StaffSelectionSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [{ staff }] = api.staff.getQualifiedStaffForCourse.useSuspenseQuery({
    sectionId,
  });

  return (
    <div className="mx-0.5">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search assistants..."
      />
      <p className="text-muted-foreground p-1 text-sm">
        {staff.length} qualified staff
      </p>

      <Droppable id={STAFF_SIDEBAR_ID} data={{ action: "remove" }}>
        <ul className="space-y-1 py-4">
          {staff.map((s) => (
            <li key={s.id}>
              <Draggable id={s.id} data={{ staff: s }}>
                <StaffItem {...s} />
              </Draggable>
            </li>
          ))}
        </ul>
      </Droppable>
    </div>
  );
}
