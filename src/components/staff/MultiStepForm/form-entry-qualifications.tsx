"use client";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import type { S } from "node_modules/@prisma/studio-core/dist/adapter-C3ET9x9-";

export type Section = {
  term: string;
  id: string;
  courseSection: string;
  instructor: string | null;
};
export type Course = {
  code: string;
  title: string;
  description: string;
  sections: Section[];
};

interface FormEntryQualificationsProps {
  userId: string;
  termId: string;
  courses: Course[];
  prevData: string[];
  onChange: (selectedSectionIds: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

const FormEntryQualifications: React.FC<FormEntryQualificationsProps> = ({
  userId,
  termId,
  courses = [],
  prevData,
  onChange,
  onNext,
  onBack,
  onSubmit,
}) => {
  const utils = api.useUtils();
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation({
    onError: (error) => {
      console.error("Failed to save qualifications:", error);
    },
    onSuccess: (_data, variables) => {
      toast.success("Form saved successfully");
      void utils.studentDashboard.invalidate();
      if (
        !variables.qualifiedSectionIds ||
        variables.qualifiedSectionIds.length === 0
      ) {
        onSubmit();
      }
      onNext();
    },
  });

  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(prevData),
  );
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    () => new Set([]),
  );
  const [drawerCourse, setDrawerCourse] = useState<Course | null>(null);
  const isMobile = useIsMobile();

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

  function toggleDescription(courseCode: string) {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(courseCode)) next.delete(courseCode);
      else next.add(courseCode);
      return next;
    });
  }

  function clearSelections() {
    setSelectedSections(new Set([]));
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-4 text-xl font-semibold">
        Select courses and sections you are qualified to work for
      </h2>

      <Button
        onClick={clearSelections}
        disabled={selectedSections.size === 0}
        variant="destructive"
      >
        Clear
      </Button>

      <div className="grid max-h-[calc(100vh-25rem)] grid-cols-1 gap-4 overflow-y-auto pr-4">
        {courses.map((course) => {
          const courseSelected = isCourseSelected(course);
          return (
            <div key={course.code} className="rounded-lg border shadow-sm">
              <label
                htmlFor={course.code}
                className="hover:bg-input flex w-full items-center justify-between gap-3 gap-4 rounded-md p-4 text-left"
              >
                <div className="flex flex-1 items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMobile) {
                        setDrawerCourse(course);
                      } else {
                        toggleDescription(course.code);
                      }
                    }}
                    className="hover:bg-secondary inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border text-xs"
                  >
                    i
                  </button>
                  <div className="text-lg font-medium">
                    {course.code} - {course.title}
                  </div>
                </div>
                <div>
                  <Label className="inline-flex items-center gap-2">
                    <Checkbox
                      id={course.code}
                      checked={courseSelected}
                      onClick={() => toggleCourse(course)}
                      onChange={() => toggleCourse(course)}
                      aria-label={`Select all sections for ${course.code}`}
                    />
                  </Label>
                </div>
              </label>
              {!isMobile && expandedDescriptions.has(course.code) && (
                <div className="bg-secondary border-t px-4 py-3 text-sm">
                  {course.description}
                </div>
              )}

              <div className="border-t p-3">
                <ul className="space-y-2">
                  {course.sections.map((section) => (
                    <li
                      key={section.id}
                      className="hover:bg-input flex items-center justify-between rounded-md"
                    >
                      <label
                        htmlFor={section.id}
                        className="flex w-full items-center justify-between gap-3 p-2 text-left"
                      >
                        <div>
                          <div className="font-medium">
                            {section.term}
                            {section.courseSection} -{" "}
                            {section.instructor ?? "TBD"}
                          </div>
                        </div>
                        <Checkbox
                          id={section.id}
                          checked={isSectionSelected(section.id)}
                          onClick={() => toggleSection(section.id)}
                          onChange={() => toggleSection(section.id)}
                          tabIndex={0}
                          aria-label={`Select section ${section.term}${section.courseSection} for ${course.code}`}
                        />
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={saveFormMutation.isPending}
        >
          Back
        </Button>
        <Button onClick={handleNextClick} disabled={saveFormMutation.isPending}>
          Next
        </Button>
      </div>

      <Drawer
        open={!!drawerCourse}
        onOpenChange={(open) => {
          if (!open) setDrawerCourse(null);
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {drawerCourse?.code} - {drawerCourse?.title}
            </DrawerTitle>
            <DrawerDescription>{drawerCourse?.description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex justify-center p-4">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default FormEntryQualifications;
