import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type SectionSolverStatusProps = {
  marginOfError: number;
  hoursRequired: number;
  hoursAssigned: number;
};

export function SectionSolverStatus({
  hoursRequired,
  marginOfError,
  hoursAssigned,
}: SectionSolverStatusProps) {
  const difference = Math.abs(hoursRequired - hoursAssigned);
  const isAssignedExactlyNumberOfHoursNeeded = difference === 0;
  const isWithinMarginOfError =
    difference <= marginOfError && !isAssignedExactlyNumberOfHoursNeeded;

  return (
    <Tooltip>
      <TooltipTrigger className="ml-auto" asChild>
        <Badge
          variant={
            isAssignedExactlyNumberOfHoursNeeded
              ? "success"
              : isWithinMarginOfError
                ? "warning"
                : "destructive"
          }
        >
          {hoursAssigned}/{hoursRequired}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {isAssignedExactlyNumberOfHoursNeeded
            ? "This class's assigned assistant hours are exactly what the course needs."
            : isWithinMarginOfError
              ? "This class's assigned assistant hours are within an acceptable range."
              : "This class's assigned assistant hours are either too high or too low."}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
