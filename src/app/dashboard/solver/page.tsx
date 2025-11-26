"use client";
import { SectionAccordion } from "@/components/section-accordion.tsx";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";
import { StaffSelectionSidebar } from "@/components/staff-selection-sidebar";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { GlobalSuspense } from "@/components/global-suspense";

export default function SolverPage() {
  const [selectedSectionId, setSelectedSectionId] = useState<
    string | undefined
  >();

  const [{ courses }] = api.courses.getAllCoursesForTerm.useSuspenseQuery({
    termId: "cmidsm56y0000v8vaqgdz42sc",
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
          <GlobalSuspense>
            <SectionAccordion
              selected={selectedSectionId}
              onSelectedChange={setSelectedSectionId}
              classes={courses}
            />
          </GlobalSuspense>
        </ResizablePanel>
        <ResizableHandle withHandle className="my-2" />
        <ResizablePanel defaultSize={25} maxSize={50} minSize={12}>
          <aside className="pt-2">
            <GlobalSuspense>
              {!selectedSectionId ? (
                <h2 className="text-center text-lg font-semibold">
                  No section selected!
                </h2>
              ) : (
                <StaffSelectionSidebar sectionId={selectedSectionId} />
              )}
            </GlobalSuspense>
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
