import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionSolverStatus } from "./section-solver-status";
import { AssistantItem } from "./assistant-item";
import { type RouterOutputs } from "@/trpc/react";

type SectionAccordionProps = {
  selected: string | undefined;
  onSelectedChange: (val: string) => void;
  classes: RouterOutputs["courses"]["getAllCoursesForTerm"]["courses"];
};

export function SectionAccordion({
  classes,
  onSelectedChange,
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
            {section.courseCode} - {section.title}
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
              <CardContent className="space-y-1 text-sm">
                <ul className="space-y-1">
                  {section.staff.map((s) => (
                    <li key={s.id}>
                      <AssistantItem {...s} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
