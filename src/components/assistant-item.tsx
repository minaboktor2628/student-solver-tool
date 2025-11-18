import { GripVertical } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export type AssistantItemProps = {
  id: string;
  name: string;
  role: "PLA" | "TA";
  hours: number;
  comments: string;
  preferences: [string, string, string];
};

export function AssistantItem({
  name,
  role,
  hours,
  id,
  preferences,
  comments,
}: AssistantItemProps) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <div className="bg-card hover:bg-muted/40 flex items-center justify-between rounded-lg border p-3 shadow-sm transition hover:shadow-md">
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
          <Badge className="capitalize">{role}</Badge>
        </div>
      </HoverCardTrigger>
      <HoverCardContent>extra here</HoverCardContent>
    </HoverCard>
  );
}
