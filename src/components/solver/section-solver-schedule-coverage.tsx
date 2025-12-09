import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateCoverage, type Slot } from "@/lib/schedul-selector";
import { CalendarIcon } from "lucide-react";

export type SectionSolverScheduleCoverageProp = {
  needed: Slot[];
  assigned: Slot[];
};

export function SectionSolverScheduleCoverage({
  assigned,
  needed,
}: SectionSolverScheduleCoverageProp) {
  const { percent } = calculateCoverage(needed, assigned);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={
            percent < 50 ? "destructive" : percent < 75 ? "warning" : "success"
          }
        >
          {percent}% <CalendarIcon />
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {percent < 50
          ? "Scheduling coverage is less than 50%"
          : percent < 75
            ? "Scheduling coverage is less than 75%"
            : "Scheduling coverage is more than 75%"}
      </TooltipContent>
    </Tooltip>
  );
}
