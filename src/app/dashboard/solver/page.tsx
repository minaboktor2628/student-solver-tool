"use client";
import { SectionAccordion } from "@/components/section-accordion.tsx";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";
import { StudentSelectionSidebar } from "@/components/student-selection-sidebar";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

const classes = [
  {
    capacity: 40,
    sectionName: "CS 1004-CL01 - Introduction To Programming For Non-Majors",
    enrollment: 40,
    instructors: "Mathew Ahrens",
    meetingPattern: "M-T-R-F | 4:00pm - 4:50pm",
    students: [],
  },
  {
    capacity: 40,
    sectionName: "CS 1001-CL02 - Introduction To Programming",
    enrollment: 50,
    instructors: "Mathew Ahrens",
    meetingPattern: "M-T-R-F | 4:00pm - 4:50pm",
    students: [],
  },
];

export default function SolverPage() {
  const [openedClass, setOpenedClass] = useState(classes[0]?.sectionName);
  const courses = api.courses.getAllCoursesForTerm.useQuery({
    year: 2025,
    termLetter: "A",
  });

  return (
    <div className="h-full px-4">
      <div className="flex items-center">
        <h1>Solver for term: {}</h1>
        <ButtonGroup className="ml-auto">
          <Button size="sm" disabled>
            Solve Next
          </Button>
          <ButtonGroupSeparator />
          <Button size="sm" disabled>
            Done
          </Button>
        </ButtonGroup>
      </div>
      <Separator className="my-2" />
      <ResizablePanelGroup direction="horizontal" className="h-full space-x-4">
        <ResizablePanel defaultSize={75}>
          <SectionAccordion
            selected={openedClass}
            onSelectedChange={setOpenedClass}
            classes={classes}
          />
        </ResizablePanel>
        <ResizableHandle withHandle className="my-2" />
        <ResizablePanel defaultSize={25} maxSize={50} minSize={12}>
          <aside className="pt-2">
            <StudentSelectionSidebar
              sectionName={openedClass}
              students={[
                {
                  role: "PLA",
                  id: "edsfas",
                  comments: "i like cheese",
                  hours: 10,
                  name: "mina boktor",
                  preferences: ["cs2303", "cs3034", "cs3733"],
                },
              ]}
            />
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
