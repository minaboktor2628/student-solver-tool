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
import { LoadingSpinner } from "@/components/loading-spinner";

export default function SolverPage() {
  const [selectedSectionId, setSelectedSectionId] = useState<
    string | undefined
  >();

  const courses = api.courses.getAllCoursesForTerm.useQuery({
    termId: "cmidsm56y0000v8vaqgdz42sc",
  });

  if (courses.isError) return <>error</>; // TODO: make this better
  if (courses.isPending) return <LoadingSpinner />;

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
            selected={selectedSectionId}
            onSelectedChange={setSelectedSectionId}
            classes={courses.data.courses}
          />
        </ResizablePanel>
        <ResizableHandle withHandle className="my-2" />
        <ResizablePanel defaultSize={25} maxSize={50} minSize={12}>
          <aside className="pt-2">
            <StudentSelectionSidebar sectionId={selectedSectionId} />
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
