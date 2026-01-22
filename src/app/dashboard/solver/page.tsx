"use client";
import { SectionAccordion } from "@/components/solver/section-accordion.tsx";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";
import { StaffSelectionSidebar } from "@/components/solver/staff-selection-sidebar";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { GlobalSuspense } from "@/components/global-suspense";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { StaffItem, type StaffItemProps } from "@/components/solver/staff-item";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { AleadyAssignedAlert } from "@/components/solver/already-assigned-alert";
import { toast } from "sonner";
import { TermCombobox, useTerm } from "@/components/term-combobox";
import Link from "next/link";

type PendingAssign = {
  toSectionId: string;
  staffId: string;
  toSectionCode: string;
  fromSectionCode: string;
  fromSectionId: string;
} | null;

export default function SolverPage() {
  const { selectedId: termId } = useTerm();
  const [activeStaff, setActiveStaff] = useState<StaffItemProps | null>(null);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<PendingAssign>(null);
  const [showAssignWarning, setShowAssignWarning] = useLocalStorage(
    "showassignwarning",
    true,
  );
  const [selectedSectionId, setSelectedSectionId] = useState<
    string | undefined
  >();

  if (!termId) throw new Error("Term id is invalid.");
  const [{ courses }] = api.courses.getAllCoursesForTerm.useSuspenseQuery({
    termId,
  });

  const utils = api.useUtils();

  const solverApi = api.assignment.solve.useMutation({
    onSettled: async () => {
      await Promise.all([
        utils.courses.getAllCoursesForTerm.invalidate({ termId }),
        utils.staff.getStaffForSection.invalidate(),
      ]);
    },
  });

  const toggleLock = api.assignment.toggleAssignmentLock.useMutation({
    onMutate: async ({ sectionId, staffId }) => {
      await utils.courses.getAllCoursesForTerm.cancel({ termId });
      const previous = utils.courses.getAllCoursesForTerm.getData({ termId });

      utils.courses.getAllCoursesForTerm.setData({ termId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          courses: old.courses.map((course) => {
            if (course.id !== sectionId) return course;

            return {
              ...course,
              staff: course.staff.map((s) =>
                s.id === staffId ? { ...s, locked: !s.locked } : s,
              ),
            };
          }),
        };
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.courses.getAllCoursesForTerm.setData(
          { termId },
          context.previous,
        );
      }
    },

    onSettled: async () => {
      await Promise.all([
        utils.courses.getAllCoursesForTerm.invalidate({ termId }),
        utils.staff.getStaffForSection.invalidate(),
      ]);
    },
  });

  const assignApi = api.assignment.set.useMutation({
    onMutate: async ({ sectionId, staffId }) => {
      await utils.courses.getAllCoursesForTerm.cancel({ termId });

      const prevCourses = utils.courses.getAllCoursesForTerm.getData({
        termId,
      });
      const prevStaff = utils.staff.getStaffForSection.getData({
        sectionId,
      });

      // Prefer the currently dragged staff, fall back if needed
      const staff =
        activeStaff ??
        prevStaff?.staff.find((s) => s.id === staffId) ??
        prevCourses?.courses
          .flatMap((c) => c.staff)
          .find((s) => s.id === staffId);

      if (!staff || !prevCourses) {
        return { prevCourses, prevStaff };
      }

      // Remove from qualified list for this section (sidebar)
      utils.staff.getStaffForSection.setData({ sectionId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          staff: old.staff.filter((s) => s.id !== staffId),
        };
      });

      // Add to assigned staff for this section in courses
      utils.courses.getAllCoursesForTerm.setData({ termId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          courses: old.courses.map((course) => {
            if (course.id !== sectionId) return course;
            if (course.staff.some((s) => s.id === staffId)) return course;
            return {
              ...course,
              staff: [...course.staff, staff],
            };
          }),
        };
      });

      return { prevCourses, prevStaff };
    },

    onError: (_err, { sectionId }, ctx) => {
      if (ctx?.prevStaff) {
        utils.staff.getStaffForSection.setData({ sectionId }, ctx.prevStaff);
      }
      if (ctx?.prevCourses) {
        utils.courses.getAllCoursesForTerm.setData({ termId }, ctx.prevCourses);
      }
    },

    onSettled: async (_data, _err) => {
      await Promise.all([
        utils.courses.getAllCoursesForTerm.invalidate({ termId }),
        utils.staff.getStaffForSection.invalidate(),
      ]);
    },
  });

  const unassignApi = api.assignment.remove.useMutation({
    onMutate: async ({ sectionId, staffId }) => {
      await utils.courses.getAllCoursesForTerm.cancel({ termId });

      const prevCourses = utils.courses.getAllCoursesForTerm.getData({
        termId,
      });
      const prevStaff = utils.staff.getStaffForSection.getData({
        sectionId,
      });

      const staff =
        activeStaff ??
        prevCourses?.courses
          .flatMap((c) => c.staff)
          .find((s) => s.id === staffId);

      utils.courses.getAllCoursesForTerm.setData({ termId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          courses: old.courses.map((course) => {
            if (course.id !== sectionId) return course;
            return {
              ...course,
              staff: course.staff.filter((s) => s.id !== staffId),
            };
          }),
        };
      });

      utils.staff.getStaffForSection.setData({ sectionId }, (old) => {
        if (!old || !staff) return old;
        if (old.staff.some((s) => s.id === staffId)) return old;
        return {
          ...old,
          staff: [...old.staff, staff],
        };
      });

      return { prevCourses, prevStaff };
    },

    onError: (_e, { sectionId }, ctx) => {
      if (ctx?.prevStaff)
        utils.staff.getStaffForSection.setData({ sectionId }, ctx.prevStaff);
      if (ctx?.prevCourses)
        utils.courses.getAllCoursesForTerm.setData({ termId }, ctx.prevCourses);
    },

    onSettled: async (_data, _err) => {
      await Promise.all([
        utils.courses.getAllCoursesForTerm.invalidate({ termId }),
        utils.staff.getStaffForSection.invalidate(),
      ]);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    if (!over || typeof over.id !== "string" || typeof active.id !== "string") {
      setActiveStaff(null);
      return;
    }

    if (over.data.current?.action === "remove") {
      if (!selectedSectionId) {
        setActiveStaff(null);
        return;
      }

      // Figure out which section this staff is currently assigned to
      const assignedSectionId = activeStaff?.assignedSection?.id;

      // If they aren't assigned or assigned to a different section, don't call unassign at all.
      if (!assignedSectionId || assignedSectionId !== selectedSectionId) {
        setActiveStaff(null);
        return;
      }

      unassignApi.mutate({
        sectionId: selectedSectionId,
        staffId: active.id,
      });
      setActiveStaff(null);
      return;
    }

    if (over.data.current?.action === "assign") {
      const isAlreadyAssigned = !!active.data.current?.isAlreadyAssigned;
      const toSectionId = over.id;
      const staffId = active.id;

      if (isAlreadyAssigned && showAssignWarning) {
        setPendingAssign({
          toSectionId,
          staffId,
          toSectionCode: (over.data.current?.code as string) ?? "",
          fromSectionCode: activeStaff?.assignedSection?.code ?? "",
          fromSectionId: activeStaff?.assignedSection?.id ?? "",
        });
        setWarningDialogOpen(true);
        return;
      }

      if (isAlreadyAssigned && activeStaff?.assignedSection?.id) {
        try {
          unassignApi.mutate({
            sectionId: activeStaff.assignedSection.id,
            staffId,
          });
        } catch {
          setActiveStaff(null);
          return;
        }
      }

      assignApi.mutate({ sectionId: toSectionId, staffId });
      setActiveStaff(null);
      return;
    }

    toast.error("Unexpected drag action");
    setActiveStaff(null);
  }

  function handleDragStart(event: DragStartEvent) {
    const staff = event.active.data.current?.staff as
      | StaffItemProps
      | undefined;
    if (staff) {
      setActiveStaff(staff);
    }
  }

  function handleDragCancel() {
    setActiveStaff(null);
  }

  function handleSolve() {
    if (!termId) return;
    solverApi.mutate({ termId });
  }

  return (
    <div className="flex h-[100vh] flex-col">
      <AleadyAssignedAlert
        open={warningDialogOpen}
        fromCourse={pendingAssign?.fromSectionCode ?? ""}
        toCourse={pendingAssign?.toSectionCode ?? ""}
        staffName={activeStaff?.name ?? ""}
        onOpenChange={(open) => setWarningDialogOpen(open)}
        onDontShowAgain={() => setShowAssignWarning(false)}
        onCancel={() => {
          setWarningDialogOpen(false);
          setPendingAssign(null);
          setActiveStaff(null);
        }}
        onConfirm={() => {
          if (pendingAssign) {
            unassignApi.mutate({
              sectionId: pendingAssign.fromSectionId,
              staffId: pendingAssign.staffId,
            });
            assignApi.mutate({
              sectionId: pendingAssign.toSectionId,
              staffId: pendingAssign.staffId,
            });
          }
          setWarningDialogOpen(false);
          setPendingAssign(null);
          setActiveStaff(null);
        }}
      />
      <div className="flex items-center px-4">
        <h1 className="pr-2 font-bold">Term: </h1> <TermCombobox />
        <ButtonGroup className="ml-auto">
          <Button
            size="sm"
            onClick={handleSolve}
            disabled={solverApi.isPending}
          >
            Solve Next
          </Button>
          <ButtonGroupSeparator />
          <Button size="sm" asChild>
            <Link href={"/dashboard"}>Done</Link>
          </Button>
        </ButtonGroup>
      </div>
      <Separator className="mt-2" />
      <div className="min-h-0 flex-1">
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full min-h-0"
          >
            <ResizablePanel defaultSize={70} className="min-h-0">
              <GlobalSuspense>
                <SectionAccordion
                  selected={selectedSectionId}
                  onSelectedChange={setSelectedSectionId}
                  onUnassign={unassignApi.mutate}
                  onToggleAssignmentLock={toggleLock.mutate}
                  classes={courses}
                />
              </GlobalSuspense>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={30}
              maxSize={50}
              minSize={12}
              className="min-h-0"
            >
              <aside className="h-full">
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
          <DragOverlay wrapperElement="div">
            {activeStaff ? (
              <div className="pointer-events-none z-50">
                <StaffItem {...activeStaff} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
