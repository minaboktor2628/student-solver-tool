import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionSolverStatus } from "./section-solver-status";
import { calculateRequiredAssistantHours } from "@/lib/utils";

type Props = {
  selected: string | undefined; // section that is selected; corresponds to sectionName
  onSelectedChange: (val: string) => void;
  classes: {
    sectionName: string; //id
    meetingPattern: string;
    enrollment: number;
    capacity: number;
    instructors: string;
    students: {
      id: string;
      name: string;
      role: "PLA" | "TA";
      hours: number;
    }[];
  }[];
};

export function SectionAccordion({
  classes,
  onSelectedChange,
  selected,
}: Props) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      value={selected}
      onValueChange={onSelectedChange}
    >
      {classes.map(
        ({
          students,
          meetingPattern,
          instructors,
          enrollment,
          capacity,
          sectionName,
        }) => (
          <AccordionItem value={sectionName} key={sectionName}>
            <AccordionTrigger className="flex flex-row items-center text-xl">
              {sectionName}
              <SectionSolverStatus
                marginOfError={10}
                hoursRequired={calculateRequiredAssistantHours(enrollment)}
                hoursAssigned={students.reduce(
                  (accumulator, currVal) => accumulator + currVal.hours,
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
                  <p>Meeting pattern: {meetingPattern}</p>
                  <p>Instructors: {instructors}</p>
                  <p>Capacity: {capacity}</p>
                </CardContent>
              </Card>
              <Card className="flex-2">
                <CardHeader>
                  <CardTitle>Assigned Assistants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm"></CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ),
      )}
    </Accordion>
  );
}
