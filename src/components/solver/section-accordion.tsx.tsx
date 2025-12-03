import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionSolverStatus } from "./section-solver-status";
import { type RouterInputs, type RouterOutputs } from "@/trpc/react";
import { toFullCourseName } from "@/lib/utils";
import { SectionInfoCard } from "./section-info-card";
import { AssignedAssistantsCard } from "./assigned-assistant-card";

export type SectionAccordionProps = {
  selected: string | undefined;
  onSelectedChange: (val: string) => void;
  onUnassign: (input: RouterInputs["staffAssignment"]["remove"]) => void;
  onToggleAssignmentLock: (
    input: RouterInputs["staffAssignment"]["toggleAssignmentLock"],
  ) => void;
  classes: RouterOutputs["courses"]["getAllCoursesForTerm"]["courses"];
};

export function SectionAccordion({
  classes,
  onSelectedChange,
  onUnassign,
  onToggleAssignmentLock,
  selected,
}: SectionAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      value={selected}
      onValueChange={onSelectedChange}
    >
      {classes.map((section) => (
        <AccordionItem value={section.id} key={section.id}>
          <AccordionTrigger className="flex flex-row items-center text-xl">
            {toFullCourseName(
              section.courseCode,
              section.courseSection,
              section.title,
            )}
            <SectionSolverStatus
              marginOfError={10} // TODO: not hardcode this
              hoursRequired={section.requiredHours}
              hoursAssigned={section.staff.reduce(
                (accumulator, currVal) => accumulator + (currVal.hours ?? 0),
                0,
              )}
            />
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
  );
}
