"use client";
import React, { useMemo, useState } from "react";
import { api } from "@/trpc/react";

type TokenType = "prefer" | "strong";

export type Section = {
  term: string;
  id: string;
  courseSection: string;
  instructor?: string;
};
export type Course = { code: string; title: string; sections: Section[] };

interface CoursePreferencesProps {
  userId: string;
  termId: string;
  qualifiedSectionIds: string[];
  comments: string;
  /** array of courses with sections that the user qualified for */
  courses?: Course[];
  /** array of selected section ids from qualifications step */
  selectedSectionIds: string[];
  /** mapping from section id to token type */
  onChange?: (mapping: Record<string, TokenType | undefined>) => void;
  onNext?: () => void;
  onExit?: () => void;
}

const FormEntryPreferences: React.FC<CoursePreferencesProps> = ({
  userId,
  termId,
  qualifiedSectionIds,
  comments,
  courses: coursesProp,
  selectedSectionIds,
  onChange,
  onNext,
  onExit,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation();
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

  async function handleNextClick() {
    setIsSaving(true);
    try {
      await saveFormMutation.mutateAsync({
        userId,
        termId,
        qualifiedSectionIds,
        sectionPreferences: mapping,
        comments,
      });
      onNext?.();
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
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

  function handleDrop(sectionId: string, token: TokenType) {
    setMapping((prev) => {
      const existing = prev[sectionId];
      if (existing === token) return prev;

      if (token === "prefer" && numPreferTokens <= 0) return prev;
      if (token === "strong" && numStrongTokens <= 0) return prev;

      const next = { ...prev, [sectionId]: token };

      onChange?.(next);
      return next;
    });
  }

  function handleRemoveToken(sectionId: string) {
    setMapping((prev) => {
      const existing = prev[sectionId];
      if (!existing) return prev;

      const next = { ...prev };
      delete next[sectionId];

      onChange?.(next);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-4 text-xl font-semibold">
        Drag preference tokens to sections you prefer to work for
      </h2>

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          {numPreferTokens > 0 && (
            <div
              draggable
              onDragStart={(e) =>
                e.dataTransfer?.setData("text/plain", "prefer")
              }
              className="cursor-grab rounded-full bg-blue-100 px-3 py-1 text-sm font-medium"
            >
              Prefer
            </div>
          )}
          <span className="text-muted-foreground text-sm">
            {numPreferTokens}/{originalNumPreferTokens}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {numStrongTokens > 0 && (
            <div
              draggable
              onDragStart={(e) =>
                e.dataTransfer?.setData("text/plain", "strong")
              }
              className="cursor-grab rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium"
            >
              Strongly Prefer
            </div>
          )}
          <span className="text-muted-foreground text-sm">
            {numStrongTokens}/{originalNumStrongTokens}
          </span>
        </div>

        <div className="text-muted-foreground text-sm">
          Drag a preference onto a section
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredCourses.map((course) => (
          <div
            key={course.code}
            className="rounded-lg border bg-white shadow-sm"
          >
            <div className="rounded-md p-4">
              <div className="text-lg font-medium">
                {course.code} - {course.title}
              </div>
            </div>

            <div className="border-t p-3">
              <ul className="space-y-2">
                {course.sections.map((section) => (
                  <li
                    key={section.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const token = e.dataTransfer?.getData("text/plain") as
                        | TokenType
                        | undefined;
                      if (token === "prefer" || token === "strong") {
                        handleDrop(section.id, token);
                      }
                    }}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">
                        {section.term}
                        {section.courseSection} -{" "}
                        {section.instructor ?? "No instructor"}
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
                            ×
                          </span>
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Drop preference here
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        {onNext && (
          <button
            onClick={handleNextClick}
            disabled={isSaving}
            className="bg-primary/70 hover:bg-primary/100 rounded-lg px-4 py-2 text-white disabled:opacity-50"
          >
            Next
          </button>
        )}
        {onExit && (
          <button
            onClick={onExit}
            className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default FormEntryPreferences;
