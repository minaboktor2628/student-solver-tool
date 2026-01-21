import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionSolverHourCoverage } from "./section-solver-hour-coverage";
import { type RouterInputs, type RouterOutputs } from "@/trpc/react";
import { toFullCourseName } from "@/lib/utils";
import { SectionInfoCard } from "./section-info-card";
import { AssignedAssistantsCard } from "./assigned-assistant-card";
import { SectionSolverScheduleCoverage } from "./section-solver-schedule-coverage";
import { ScrollArea } from "../ui/scroll-area";

export type SectionAccordionProps = {
  selected: string | undefined;
  onSelectedChange: (val: string) => void;
  onUnassign: (input: RouterInputs["assignment"]["remove"]) => void;
  onToggleAssignmentLock: (
    input: RouterInputs["assignment"]["toggleAssignmentLock"],
  ) => void;
  classes: RouterOutputs["courses"]["getAllCoursesForTerm"]["courses"];
};

// TODO: add filter search bar and filters
// sorting by scheduling percent coverage, assigned hours etc
export function SectionAccordion({
  classes,
  onSelectedChange,
  onUnassign,
  onToggleAssignmentLock,
  selected,
}: SectionAccordionProps) {
  return (
    <ScrollArea className="h-full">
      <Accordion
        type="single"
        collapsible
        className="h-full w-full"
        value={selected}
        onValueChange={onSelectedChange}
      >
        {classes.map((section) => (
          <AccordionItem value={section.id} key={section.id} className="px-4">
            <AccordionTrigger className="flex flex-row items-center text-xl">
              {toFullCourseName(
                section.courseCode,
                section.courseSection,
                section.title,
              )}
              <div className="ml-auto flex space-x-2">
                <SectionSolverScheduleCoverage
                  needed={section.professor.timesRequired}
                  assigned={section.staff.flatMap((s) => s.timesAvailable)}
                />
                <SectionSolverHourCoverage
                  marginOfError={10} // TODO: not hardcode this
                  hoursRequired={section.requiredHours}
                  hoursAssigned={section.staff.reduce(
                    (accumulator, currVal) =>
                      accumulator + (currVal.hours ?? 0),
                    0,
                  )}
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex space-x-4 text-balance">
              <SectionInfoCard section={section} />
              <AssignedAssistantsCard
                section={section}
                onUnassign={onUnassign}
                onToggleAssignmentLock={onToggleAssignmentLock}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
}
