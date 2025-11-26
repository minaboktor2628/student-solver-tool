"use client";
import { useState } from "react";
import { Input } from "./ui/input";
import { StaffItem } from "./staff-item";
import { api } from "@/trpc/react";

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
      <ul className="space-y-1 py-4">
        {staff.map((s) => (
          <li key={s.id}>
            <StaffItem {...s} />
          </li>
        ))}
      </ul>
    </div>
  );
}
