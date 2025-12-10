"use client";
import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { StaffItem } from "./staff-item";
import { api, type RouterOutputs } from "@/trpc/react";
import { Draggable } from "../draggable";
import { Droppable } from "../droppable";
import {
  CircleAlertIcon,
  FunnelIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { normalize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";

export const STAFF_SIDEBAR_ID = "StaffSelectionSidebar" as const;

export type StaffSelectionSidebarProps = {
  sectionId: string;
};

type FilterKey =
  keyof RouterOutputs["staff"]["getStaffForSection"]["staff"][number]["flags"];

export const StaffFilterMap: Record<FilterKey, string> = {
  availableThisTerm: "Available",
  notAvoidedByProfessor: "Not Avoided",
  qualifiedForThisSection: "Qualified",
};

export function StaffSelectionSidebar({
  sectionId,
}: StaffSelectionSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterKey[]>([
    "qualifiedForThisSection",
    "notAvoidedByProfessor",
  ]);
  const [{ staff }] = api.staff.getStaffForSection.useSuspenseQuery({
    sectionId,
  });

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  const filteredStaff = useMemo(() => {
    let result = staff;

    for (const key of filters) {
      result = result.filter((s) => s.flags?.[key]);
    }

    const q = normalize(searchTerm).trim();
    if (!q) return result;

    const tokens = q.split(/\s+/).filter(Boolean);
    return result.filter((s) => {
      const name = normalize(s.name ?? "");
      const email = normalize(s.email ?? "");
      return tokens.every((t) => name.includes(t) || email.includes(t));
    });
  }, [staff, filters, searchTerm]);

  return (
    <div className="bg-card/40 flex h-full flex-col p-2">
      <div className="flex gap-1">
        <div className="relative flex-1">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <FunnelIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="left">
            <DropdownMenuLabel>Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {(Object.entries(StaffFilterMap) as [FilterKey, string][]).map(
              ([key, label]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={filters.includes(key)}
                  onCheckedChange={() => toggleFilter(key)}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-muted-foreground p-1 text-sm">
        {filteredStaff.length} of {staff.length} staff
      </p>

      <Droppable
        id={STAFF_SIDEBAR_ID}
        data={{ action: "remove" }}
        className="flex-1 overflow-y-auto"
      >
        <ScrollArea className="h-full">
          <ul className="space-y-1">
            {filteredStaff.map((s) => (
              <li key={s.id} className="flex flex-row items-center space-x-2">
                <Draggable
                  id={s.id}
                  data={{ staff: s, isAlreadyAssigned: !!s.assignedSection }}
                  className="flex-1"
                >
                  <StaffItem {...s}>
                    <div className="flex flex-row space-x-2">
                      {!s.flags.availableThisTerm && (
                        <Tooltip>
                          <TooltipTrigger className="self-center">
                            <TriangleAlertIcon className="text-warning size-6" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Staff is assigned to {s.assignedSection?.code}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {!s.flags.notAvoidedByProfessor && (
                        <Tooltip>
                          <TooltipTrigger className="self-center">
                            <CircleAlertIcon className="text-destructive size-6" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Staff is an anti-preference of the professor
                              teaching this section.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {!s.flags.qualifiedForThisSection && (
                        <Tooltip>
                          <TooltipTrigger className="self-center">
                            <CircleAlertIcon className="text-destructive size-6" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Staff has reported that they are unqualified for
                              this section.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </StaffItem>
                </Draggable>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Droppable>
    </div>
  );
}
