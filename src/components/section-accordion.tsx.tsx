import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionSolverStatus } from "./section-solver-status";
import { StaffItem } from "./staff-item";
import { type RouterInputs, type RouterOutputs } from "@/trpc/react";
import { Droppable } from "./droppable";
import { Draggable } from "./draggable";
import { Button } from "./ui/button";
import { LockIcon, UnlockIcon, XIcon } from "lucide-react";
import { Toggle } from "./ui/toggle";
import { toFullCourseName } from "@/lib/utils";

type SectionAccordionProps = {
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
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Section Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Instructor: {section.professor.name}</p>
                <p>Capacity: {section.capacity}</p>
                <p>Enrollment: {section.enrollment}</p>
              </CardContent>
            </Card>
            <Card className="flex-2">
              <CardHeader>
                <CardTitle>Assigned Assistants</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <Droppable id={section.id} className="h-full">
                  <ul className="space-y-2">
                    {section.staff.map((staff) => (
                      <li
                        key={staff.id}
                        className="flex flex-row items-center space-x-2"
                      >
                        <Toggle
                          variant="outline"
                          aria-label="Toggle lock"
                          title={`Lock/unlock ${staff.name} to ${section.courseCode}`}
                          pressed={staff.locked}
                          onPressedChange={() =>
                            onToggleAssignmentLock({
                              sectionId: section.id,
                              staffId: staff.id,
                            })
                          }
                        >
                          {staff.locked ? <LockIcon /> : <UnlockIcon />}
                        </Toggle>
                        <Draggable
                          id={staff.id}
                          data={{ staff: staff }}
                          className="flex-1"
                        >
                          <StaffItem {...staff} />
                        </Draggable>
                        <Button
                          size="icon"
                          variant="destructive"
                          title={`Unassign ${staff.name} from ${section.courseCode}`}
                          onClick={() =>
                            onUnassign({
                              sectionId: section.id,
                              staffId: staff.id,
                            })
                          }
                        >
                          <XIcon />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Droppable>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
