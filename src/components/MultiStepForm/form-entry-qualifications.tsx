"use client";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { useTerm } from "@/components/term-combobox";

export type Section = {
  term: string;
  id: string;
  courseSection: string;
  instructor?: string;
};
export type Course = { code: string; title: string; sections: Section[] };

interface FormEntryQualificationsProps {
  userId: string;
  termId: string;
  courses?: Course[];
  onChange?: (selectedSectionIds: string[]) => void;
  onNext?: () => void;
  onExit?: () => void;
  onSubmit?: () => void;
}

const FormEntryQualifications: React.FC<FormEntryQualificationsProps> = ({
  userId,
  termId,
  courses = [],
  onChange,
  onNext,
  onExit,
  onSubmit,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation();

  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    () => new Set([]),
  );

  // derived map from course code -> section ids for quick lookup
  const courseToSectionIds = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of courses)
      m.set(
        c.code,
        c.sections.map((s) => s.id),
      );
    return m;
  }, [courses]);

  useEffect(() => {
    onChange?.(Array.from(selectedSections));
  }, [selectedSections]);

  async function handleNextClick() {
    // If no sections selected, skip to end/homepage
    if (selectedSections.size === 0) {
      setIsSaving(true);
      try {
        await saveFormMutation.mutateAsync({
          userId,
          termId,
          qualifiedSectionIds: [],
        });
        // Exit to homepage instead of going to next step
        onSubmit?.();
      } catch (error) {
        console.error("Failed to save qualifications:", error);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      await saveFormMutation.mutateAsync({
        userId,
        termId,
        qualifiedSectionIds: Array.from(selectedSections),
      });
      onNext?.();
    } catch (error) {
      console.error("Failed to save qualifications:", error);
    } finally {
      setIsSaving(false);
    }
  }

  function isSectionSelected(id: string) {
    return selectedSections.has(id);
  }

  function isCourseSelected(course: Course) {
    const ids = courseToSectionIds.get(course.code) ?? [];
    if (ids.length === 0) return false;
    return ids.every((id) => selectedSections.has(id));
  }

  function toggleCourse(course: Course) {
    const ids = courseToSectionIds.get(course.code) ?? [];
    const allSelected = ids.every((id) => selectedSections.has(id));
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // deselect all
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  }

  function toggleSection(sectionId: string) {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-4 text-xl font-semibold">
        Select courses and sections
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {courses.map((course) => {
          const courseSelected = isCourseSelected(course);
          return (
            <div
              key={course.code}
              className="rounded-lg border bg-white shadow-sm"
            >
              <button
                onClick={() => toggleCourse(course)}
                className="flex w-full items-center justify-between gap-3 gap-4 rounded-md p-4 text-left hover:bg-gray-50"
              >
                <div>
                  <div className="text-lg font-medium">
                    {course.code} - {course.title}
                  </div>
                </div>
                <div>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={courseSelected}
                      onChange={() => toggleCourse(course)}
                      aria-label={`Select all sections for ${course.code}`}
                      className="h-4 w-4"
                    />
                  </label>
                </div>
              </button>

              <div className="border-t p-3">
                <ul className="space-y-2">
                  {course.sections.map((section) => (
                    <li
                      key={section.id}
                      className="flex items-center justify-between rounded-md p-2 hover:bg-gray-50"
                    >
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div>
                          <div className="font-medium">
                            {section.term}
                            {section.courseSection} - {section.instructor}
                          </div>
                          <div className="text-sm text-gray-600">Section</div>
                        </div>
                      </button>
                      <input
                        type="checkbox"
                        checked={isSectionSelected(section.id)}
                        onChange={() => toggleSection(section.id)}
                        tabIndex={0}
                        className="h-4 w-4"
                        aria-label={`Select section ${section.term}${section.courseSection} for ${course.code}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
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

export default FormEntryQualifications;
