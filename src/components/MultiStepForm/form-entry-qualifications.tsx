"use client";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

/*
Type '{ code: string; title: string; sections: { term: TermLetter; id: string; courseSection: string; instructor: string | null; enrollment: number; capacity: number; academicLevel: AcademicLevel; professor: { ...; } | null; }[]; }[]' is not assignable to type 'Course[]'.
  Type '{ code: string; title: string; sections: { term: $Enums.TermLetter; id: string; courseSection: string; instructor: string | null; enrollment: number; capacity: number; academicLevel: $Enums.AcademicLevel; professor: { ...; } | null; }[]; }' is not assignable to type 'Course'.
    Types of property 'sections' are incompatible.
      Type '{ term: TermLetter; id: string; courseSection: string; instructor: string | null; enrollment: number; capacity: number; academicLevel: AcademicLevel; professor: { ...; } | null; }[]' is not assignable to type 'Section[]'.
        Type '{ term: $Enums.TermLetter; id: string; courseSection: string; instructor: string | null; enrollment: number; capacity: number; academicLevel: $Enums.AcademicLevel; professor: { ...; } | null; }' is not assignable to type 'Section'.
          Types of property 'instructor' are incompatible.
            Type 'string | null' is not assignable to type 'string'.
              Type 'null' is not assignable to type 'string'.
*/

export type Section = {
  term: string;
  id: string;
  courseSection: string;
  instructor: string | null;
};
export type Course = { code: string; title: string; sections: Section[] };

interface FormEntryQualificationsProps {
  userId: string;
  termId: string;
  courses: Course[];
  onChange: (selectedSectionIds: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

const FormEntryQualifications: React.FC<FormEntryQualificationsProps> = ({
  userId,
  termId,
  courses = [],
  onChange,
  onNext,
  onBack,
  onSubmit,
}) => {
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation({
    onError: (error) => {
      console.error("Failed to save qualifications:", error);
    },
  });

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
    onChange(Array.from(selectedSections));
  }, [selectedSections]);

  async function handleNextClick() {
    saveFormMutation.mutate({
      userId,
      termId,
      qualifiedSectionIds:
        selectedSections.size === 0 ? [] : Array.from(selectedSections),
    });

    if (selectedSections.size === 0) {
      onSubmit();
    }
    onNext();
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
        Select courses and sections you are qualified to work for
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {courses.map((course) => {
          const courseSelected = isCourseSelected(course);
          return (
            <div key={course.code} className="rounded-lg border shadow-sm">
              <div
                onClick={() => toggleCourse(course)}
                className="hover:bg-input flex w-full items-center justify-between gap-3 gap-4 rounded-md p-4 text-left"
              >
                <div>
                  <div className="text-lg font-medium">
                    {course.code} - {course.title}
                  </div>
                </div>
                <div>
                  <label className="inline-flex items-center gap-2">
                    <Checkbox
                      checked={courseSelected}
                      onChange={() => toggleCourse(course)}
                      aria-label={`Select all sections for ${course.code}`}
                    />
                  </label>
                </div>
              </div>

              <div className="border-t p-3">
                <ul className="space-y-2">
                  {course.sections.map((section) => (
                    <li
                      key={section.id}
                      className="hover:bg-input flex items-center justify-between rounded-md p-2"
                    >
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div>
                          <div className="font-medium">
                            {section.term}
                            {section.courseSection} -{" "}
                            {section.instructor ?? "TBD"}
                          </div>
                        </div>
                      </button>
                      <Checkbox
                        checked={isSectionSelected(section.id)}
                        onChange={() => toggleSection(section.id)}
                        tabIndex={0}
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
        <Button onClick={handleNextClick} disabled={saveFormMutation.isPending}>
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
  );
};

export default FormEntryQualifications;
