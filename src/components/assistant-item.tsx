import { GripVertical } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { RouterOutputs } from "@/trpc/react";
import { cn } from "@/lib/utils";

export type AssistantItemProps =
  RouterOutputs["staff"]["getQualifiedStaffForCourse"]["staff"][0];

export function AssistantItem({
  id,
  name,
  email,
  hours,
  roles,
  comments,
  timesAvailable,
  preferedSections,
  isAvailable,
  assignedSectionId,
}: AssistantItemProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            "bg-card hover:bg-muted/40 flex items-center justify-between rounded-lg border p-3 shadow-sm transition hover:shadow-md",
            !isAvailable &&
              "border-warning/60 bg-warning/5 dark:border-warning/40",
          )}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-6 cursor-grab hover:bg-transparent"
            >
              <GripVertical className="size-4" />
              <span className="sr-only">Drag to reorder</span>
            </Button>
            <span className="font-medium">{name}</span>
          </div>
          <Badge className="capitalize">{roles[0]}</Badge>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-100 space-y-2 text-sm">
        <div>
          <p className="flex justify-between font-semibold">
            {name}{" "}
            <div className="gap-1">
              {roles.map((role) => (
                <Badge key={role} className="capitalize">
                  {role}
                </Badge>
              ))}
            </div>
          </p>
          <p className="text-muted-foreground">{email}</p>
        </div>

        <div>
          <p>
            <span className="font-medium">Hours: </span> {hours ?? "N/A"}
          </p>
          <p>
            <span className="font-medium">Available: </span>
            {isAvailable ? "Yes" : "No"}
          </p>
          {assignedSectionId && (
            <p>
              <span className="font-medium">Assigned Section: </span>
              {assignedSectionId}
            </p>
          )}
        </div>

        {timesAvailable && (
          <div>
            <p className="font-medium">Times Available: {timesAvailable}</p>
          </div>
        )}

        {preferedSections && preferedSections.length > 0 && (
          <div>
            <p className="font-medium">Preferred Sections:</p>
            <ol>
              {preferedSections.map((s) => (
                <li key={s.section.id}>
                  {s.section.courseCode} - {s.section.courseTitle}
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
      </HoverCardContent>
    </HoverCard>
  );
}
