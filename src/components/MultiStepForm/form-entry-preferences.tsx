"use client";
import React, { useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "../ui/button";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Draggable } from "../draggable";
import { Droppable } from "../droppable";

type TokenType = "prefer" | "strong";

export type Section = {
  term: string;
  id: string;
  courseSection: string;
  instructor: string | null;
};
export type Course = { code: string; title: string; sections: Section[] };

interface CoursePreferencesProps {
  userId: string;
  termId: string;
  /** array of courses with sections that the user qualified for */
  courses?: Course[];
  /** array of selected section ids from qualifications step */
  selectedSectionIds: string[];
  onNext: () => void;
  onBack: () => void;
}

const FormEntryPreferences: React.FC<CoursePreferencesProps> = ({
  userId,
  termId,
  courses: coursesProp,
  selectedSectionIds,
  onNext,
  onBack,
}) => {
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation({
    onError: (error) => {
      console.error("Failed to save preferences:", error);
    },
  });

  // Filter courses to only show sections that were selected in qualifications
  const filteredCourses = useMemo(() => {
    if (!coursesProp) return [];
    const selectedSet = new Set(selectedSectionIds);
    return coursesProp
      .map((course) => ({
        ...course,
        sections: course.sections.filter((s) => selectedSet.has(s.id)),
      }))
      .filter((course) => course.sections.length > 0);
  }, [coursesProp, selectedSectionIds]);

  // mapping holds at most one token per section
  const [mapping, setMapping] = useState<Record<string, TokenType | undefined>>(
    {},
  );

  // drag/drop handlers
  const [activeToken, setActiveToken] = useState<TokenType | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const tokenType = active.id as TokenType;
    setActiveToken(tokenType);
    console.log(activeToken);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    setActiveToken(null);

    if (!over) return;

    const sectionId = over.id as string;
    const tokenType = active.id as TokenType;

    setMapping((prev) => {
      // prevent adding if same token already there
      if (prev[sectionId] === tokenType) return prev;

      // add token
      return {
        ...prev,
        [sectionId]: tokenType,
      };
    });
  }

  function handleDragCancel() {
    setActiveToken(null);
  }

  function handleNextClick() {
    saveFormMutation.mutate({
      userId,
      termId,
      sectionPreferences: mapping,
    });
    onNext();
  }

  const originalNumStrongTokens = 1;
  const originalNumPreferTokens = 3;

  const usedStrong = Object.values(mapping).filter(
    (v) => v === "strong",
  ).length;
  const usedPrefer = Object.values(mapping).filter(
    (v) => v === "prefer",
  ).length;
  const numStrongTokens = Math.max(0, originalNumStrongTokens - usedStrong);
  const numPreferTokens = Math.max(0, originalNumPreferTokens - usedPrefer);

  function handleRemoveToken(sectionId: string) {
    setMapping((prev) => {
      const existing = prev[sectionId];
      if (!existing) return prev;
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        <h2 className="mb-4 text-xl font-semibold">
          Drag preference tokens to sections you prefer to work for
        </h2>

        {/* Token area */}
        <div className="bg-secondary mb-4 flex flex-wrap items-center gap-4 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Draggable id="prefer">
              {numPreferTokens > 0 && (
                <div className="cursor-grab rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  Prefer
                </div>
              )}
            </Draggable>
            <span className="text-muted-foreground text-sm">
              {numPreferTokens}/{originalNumPreferTokens}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Draggable id="strong">
              {numStrongTokens > 0 && (
                <div className="cursor-grab rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
                  Strongly Prefer
                </div>
              )}
            </Draggable>
            <span className="text-muted-foreground text-sm">
              {numStrongTokens}/{originalNumStrongTokens}
            </span>
          </div>
          <div className="text-muted-foreground text-sm">
            Drag a preference onto a section
          </div>
        </div>

        {/* Section List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredCourses.map((course) => (
            <div
              key={course.code}
              className="border-secondary bg-background rounded-lg border shadow-sm"
            >
              <div className="rounded-md p-4">
                <div className="text-lg font-medium">
                  {course.code} - {course.title}
                </div>
              </div>

              <div className="border-t p-3">
                <ul className="space-y-2">
                  {course.sections.map((section) => (
                    <Droppable id={section.id} key={section.id}>
                      <li className="flex items-center justify-between rounded-md p-2">
                        <div>
                          <div className="font-medium">
                            {section.term}
                            {section.courseSection} -{" "}
                            {section.instructor ?? "TBD"}
                          </div>
                          <div className="text-sm text-gray-600">Section</div>
                        </div>
                        <div className="flex gap-2">
                          {mapping[section.id] ? (
                            <button
                              onClick={() => handleRemoveToken(section.id)}
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                                mapping[section.id] === "strong"
                                  ? "bg-indigo-200 text-indigo-800"
                                  : "bg-blue-200 text-blue-800"
                              }`}
                              title="Remove preference"
                              aria-label={`Remove preference for {${section.term}${section.courseSection}}`}
                            >
                              <span>
                                {mapping[section.id] === "strong"
                                  ? "★ Strongly Prefer"
                                  : "Prefer"}
                              </span>
                              <span className="ml-1 text-xs leading-none font-bold">
                                x
                              </span>
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Drop preference here
                            </span>
                          )}
                        </div>
                      </li>
                    </Droppable>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <Button
            onClick={handleNextClick}
            disabled={saveFormMutation.isPending}
          >
            Next
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            disabled={saveFormMutation.isPending}
          >
            Back
          </Button>
        </div>
      </div>
      <DragOverlay>
        {activeToken ? (
          <div
            className={`cursor-grabbing rounded-full px-3 py-1 text-sm font-medium ${
              activeToken === "strong"
                ? "bg-indigo-200 text-indigo-900"
                : "bg-blue-200 text-blue-900"
            }`}
          >
            {activeToken === "strong" ? "Strongly Prefer" : "Prefer"}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default FormEntryPreferences;
