"use client";
import { GripVertical } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { RouterOutputs } from "@/trpc/react";
import { BaseScheduleSelector, slotToDate } from "@/lib/schedule-selector";
export type StaffItemProps =
  RouterOutputs["staff"]["getStaffForSection"]["staff"][0] & {
    children?: React.ReactNode;
  };

export function StaffItem({
  id,
  name,
  email,
  hours,
  roles,
  comments,
  timesAvailable,
  preferedSections,
  assignedSection,
  children,
}: StaffItemProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="bg-card hover:bg-muted/40 z-10000 flex items-center justify-between rounded-lg border p-2 shadow-sm transition hover:shadow-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-6 cursor-grab hover:bg-transparent"
            >
              <GripVertical className="size-4" />
              <span className="sr-only">Drag to reorder</span>
            </Button>
            <div className="p-0">
              <p className="font-semibold">{name}</p>
              <p className="text-muted-foreground text-sm">{email}</p>
            </div>
            {children && <div className="flex items-center">{children}</div>}
          </div>
          <div className="gap-1">
            {roles.map((role) => (
              <Badge key={role} className="capitalize">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="flex w-100 text-sm">
        <div className="w-1/2">
          <div>
            <p className="flex justify-between font-semibold">{name}</p>
            <p className="text-muted-foreground">{email}</p>
          </div>

          <div>
            <p>
              <span className="font-medium">Hours: </span> {hours ?? "N/A"}
            </p>
            <p>
              <span className="font-medium">Assigned Section: </span>
              {assignedSection ? assignedSection.code : "N/A"}
            </p>
          </div>

          {preferedSections && preferedSections.length > 0 && (
            <div>
              <p className="font-medium">Preferred Sections:</p>
              <ol className="mx-4 list-disc">
                {preferedSections.map((s) => (
                  <li key={s.section.id}>
                    {s.section.courseCode} - {s.section.courseSection}{" "}
                    <span className="text-sm font-medium">({s.rank})</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {comments && (
            <div>
              <p className="font-medium">Comments:</p>
              <p className="text-muted-foreground whitespace-pre-line">
                {comments}
              </p>
            </div>
          )}
        </div>

        <div className="w-1/2 font-medium">
          Times Available:
          <div className="rounded-md border p-2">
            <BaseScheduleSelector
              selection={timesAvailable.map((d) => slotToDate(d))}
            />
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
