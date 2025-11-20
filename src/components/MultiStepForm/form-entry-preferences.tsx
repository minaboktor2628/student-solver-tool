"use client";
import React, { useMemo, useState } from "react";

type TokenType = "prefer" | "strong";

interface CoursePreferencesProps {
  /** array of selected section ids, e.g. 'cs1101-al01' */
  selectedSectionIds: string[];
  /** mapping from course code to a single token (mutually exclusive) */
  onChange?: (mapping: Record<string, TokenType | undefined>) => void;
  onNext?: () => void;
  onExit?: () => void;
}

function formatCourseCodeFromSectionId(sectionId: string) {
  // Try to extract a leading course code like 'cs1101' -> 'CS 1101'
  const prefix = sectionId.split("-")[0] || sectionId;
  const m = prefix.match(/^([A-Za-z]+)(\d+)(.*)$/);
  if (m) {
    const letters = (m[1] ?? "").toUpperCase();
    const nums = m[2] ?? "";
    const rest = m[3] ?? "";
    return `${letters} ${nums}${rest}`.trim();
  }
  return prefix.toUpperCase();
}

const FormEntryPreferences: React.FC<CoursePreferencesProps> = ({
  selectedSectionIds,
  onChange,
  onNext,
  onExit,
}) => {
  // derive unique course codes from section ids
  const courses = useMemo(() => {
    const set = new Set<string>();
    for (const sid of selectedSectionIds) {
      const courseCode = formatCourseCodeFromSectionId(sid);
      set.add(courseCode);
    }
    return Array.from(set);
  }, [selectedSectionIds]);

  // mapping holds at most one token per course to enforce mutual exclusivity
  const [mapping, setMapping] = useState<Record<string, TokenType | undefined>>(
    () => ({}),
  );

  function handleDrop(course: string, token: TokenType) {
    setMapping((prev) => {
      // set or replace the token for this course — ensures mutual exclusivity
      const next = { ...prev, [course]: token };
      onChange?.(next);
      return next;
    });
  }

  function handleRemoveToken(course: string) {
    setMapping((prev) => {
      const next = { ...prev };
      delete next[course];
      onChange?.(next);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          draggable
          onDragStart={(e) => e.dataTransfer?.setData("text/plain", "prefer")}
          className="cursor-grab rounded-full bg-blue-100 px-3 py-1 text-sm font-medium"
        >
          Prefer
        </div>
        <div
          draggable
          onDragStart={(e) => e.dataTransfer?.setData("text/plain", "strong")}
          className="cursor-grab rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium"
        >
          Strongly Prefer
        </div>
        <div className="text-muted-foreground text-sm">
          Drag a preference onto a course card
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {courses.length === 0 && (
          <div className="text-sm text-gray-500">No courses selected yet.</div>
        )}

        {courses.map((course) => (
          <div
            key={course}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const token = e.dataTransfer?.getData("text/plain") as
                | TokenType
                | undefined;
              if (token === "prefer" || token === "strong") {
                handleDrop(course, token);
              }
            }}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{course}</div>
                <div className="text-sm text-gray-500">
                  Drop preferences here
                </div>
              </div>
              <div className="flex gap-2">
                {mapping[course] ? (
                  <button
                    onClick={() => handleRemoveToken(course)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${mapping[course] === "strong" ? "bg-indigo-200 text-indigo-800" : "bg-blue-200 text-blue-800"}`}
                    title="Remove preference"
                    aria-label={`Remove preference for ${course}`}
                  >
                    <span>
                      {mapping[course] === "strong" ? "★ Strong" : "Prefer"}
                    </span>
                    <span className="ml-1 text-xs leading-none font-bold">
                      ×
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        {onNext && (
          <button
            onClick={onNext}
            className="bg-primary/70 hover:bg-primary/100 rounded-lg px-4 py-2 text-white"
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
