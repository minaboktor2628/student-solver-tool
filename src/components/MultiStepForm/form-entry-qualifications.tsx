"use client";
import React, { useEffect, useMemo, useState } from "react";

export type Section = {
  term: string;
  id: string;
  courseSection: string;
  instructor?: string;
};
export type Course = { code: string; title: string; sections: Section[] };

interface FormEntryQualificationsProps {
  courses?: Course[];
  initialSelectedSections?: string[];
  onChange?: (selectedSectionIds: string[]) => void;
  onNext?: () => void;
  onExit?: () => void;
}

const exampleCourses: Course[] = [
  {
    code: "CS 1101",
    title: "Intro to Programming",
    sections: [
      {
        term: "C",
        id: "cs1101-cl01",
        courseSection: "CL01",
        instructor: "Matthew Ahrens",
      },
    ],
  },
  {
    code: "CS 2102",
    title: "Object-Oriented Design Concepts",
    sections: [
      {
        term: "C",
        id: "cs2102-cl01",
        courseSection: "CL01",
        instructor: "Jennifer Mortensen",
      },
      {
        term: "C",
        id: "cs2102-cl02",
        courseSection: "CL02",
        instructor: "Yu-Shan Sun",
      },
    ],
  },
  {
    code: "CS 3733",
    title: "Software Engineering",
    sections: [
      {
        term: "C",
        id: "cs3733-cl01",
        courseSection: "CL01",
        instructor: "George Heineman",
      },
      {
        term: "C",
        id: "cs3733-cl02",
        courseSection: "CL02",
        instructor: "Wilson Wong",
      },
    ],
  },
  {
    code: "CS 4432",
    title: "Database Systems II",
    sections: [
      {
        term: "C",
        id: "cs4432-cl01",
        courseSection: "CL01",
        instructor: "Fabricio Murai",
      },
    ],
  },
];

const FormEntryQualifications: React.FC<FormEntryQualificationsProps> = ({
  courses: coursesProp,
  initialSelectedSections = [],
  onChange,
  onNext,
  onExit,
}) => {
  // The modal (parent) is responsible for fetching sections and passing them
  // into this component via the optional `courses` prop. If no prop is
  // provided this component will fall back to a small example dataset so the
  // UI can render in isolation or in storybook/tests.
  const courses: Course[] = useMemo(() => {
    return coursesProp ?? exampleCourses;
  }, [coursesProp]);

  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(initialSelectedSections),
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
  }, [selectedSections, onChange]);

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

export default FormEntryQualifications;
