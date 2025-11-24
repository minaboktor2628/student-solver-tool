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
  RouterOutputs["staff"]["getQualifiedStaffForCourse"]["available"][0] & {
    isAvailable: boolean;
  };

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
          {" "}
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
      <HoverCardContent>extra here</HoverCardContent>
    </HoverCard>
  );
}
