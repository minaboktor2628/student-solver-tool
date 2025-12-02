"use client";
import { useMemo, useState } from "react";
import { Input } from "./ui/input";
import { StaffItem } from "./staff-item";
import { api } from "@/trpc/react";
import { Draggable } from "./draggable";
import { Droppable } from "./droppable";
import { TriangleAlertIcon, XIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const STAFF_SIDEBAR_ID = "StaffSelectionSidebar" as const;

export type StaffSelectionSidebarProps = {
  sectionId: string;
};

function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents
}
export function StaffSelectionSidebar({
  sectionId,
}: StaffSelectionSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [{ staff }] = api.staff.getQualifiedStaffForCourse.useSuspenseQuery({
    sectionId,
  });

  const filteredStaff = useMemo(() => {
    const q = normalize(searchTerm).trim();
    if (!q) return staff;

    const tokens = q.split(/\s+/).filter(Boolean);
    return staff.filter((s) => {
      const name = normalize(s.name ?? "");
      const email = normalize(s.email ?? "");
      return tokens.every((t) => name.includes(t) || email.includes(t));
    });
  }, [staff, searchTerm]);

  return (
    <div className="mx-0.5 flex h-full flex-col">
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          type="search"
          placeholder="Search staff..."
          className="pr-8"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-muted-foreground p-1 text-sm">
        {filteredStaff.length} of {staff.length} qualified staff
      </p>

      <Droppable
        id={STAFF_SIDEBAR_ID}
        data={{ action: "remove" }}
        className="flex-1 overflow-y-auto"
      >
        <ul className="space-y-1">
          {filteredStaff.map((s) => (
            <li key={s.id} className="flex flex-row items-center space-x-2">
              <Draggable
                id={s.id}
                data={{ staff: s, isAlreadyAssigned: !!s.assignedSection }}
                className="flex-1"
              >
                <StaffItem {...s}>
                  {s.assignedSection && (
                    <Tooltip>
                      <TooltipTrigger className="self-center">
                        <TriangleAlertIcon className="text-warning size-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Staff is assigned to {s.assignedSection.code}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </StaffItem>
              </Draggable>
            </li>
          ))}
        </ul>
      </Droppable>
    </div>
  );
}
