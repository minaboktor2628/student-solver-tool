"use client";
import React from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type {
  SectionWithProfessorPreference,
  TimesRequiredOutput,
  WeeklySlot,
} from "@/types/professor";
import {
  calculateCoverage,
  dedupe,
  slotToDate,
  dateToSlot,
  stylesByStatus,
  BaseScheduleSelector,
} from "@/lib/schedule-selector";

type CoursesCardProps = {
  sections: Record<string, SectionWithProfessorPreference> | undefined;
  isSubmitted: boolean;
};
export const CoursesCard: React.FC<CoursesCardProps> = ({
  sections,
  isSubmitted,
}) => {
  const calendarStart = new Date(1970, 0, 5);
  const dayMap: Record<WeeklySlot["day"], number> = {
    M: 0,
    T: 1,
    W: 2,
    R: 3,
    F: 4,
  };
  function timesRequiredToDate(
    times: TimesRequiredOutput[],
    calendarStart: Date,
  ): Date[] {
    return times.map((time) => {
      const dayOffset = dayMap[time.day];

      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + dayOffset);
      date.setHours(time.hour, 0, 0, 0);

      return date;
    });
  }
  function dayLetterFromDate(d: Date): WeeklySlot["day"] | null {
    switch (d.getDay()) {
      case 1:
        return "M";
      case 2:
        return "T";
      case 3:
        return "W";
      case 4:
        return "R";
      case 5:
        return "F";
      default:
        return null;
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Courses</CardTitle>
        <CardDescription>
          Please email mahrens@wpi.edu if your assigned courses are incorrect
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Mock course data */}
          {Object.values(sections ?? {}).map((course) => (
            <div key={course.courseCode} className="rounded-lg border p-4">
              <h3 className="font-semibold">
                {course.courseCode}-{course.courseSection}
                {course.courseTitle}
              </h3>
              {isSubmitted && (
                <div>
                  <h4 className="mt-2 font-medium">Preferred Assistants</h4>
                  {course.professorPreference?.preferredStaff?.length ? (
                    <ul className="ml-4 list-disc">
                      {course.professorPreference.preferredStaff.map(
                        (assistant) => (
                          <li key={assistant.id}>{assistant.name}</li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No preferred assistants
                    </p>
                  )}

                  <h4 className="mt-2 font-medium">Avoided Assistants</h4>
                  {course.professorPreference?.avoidedStaff?.length ? (
                    <ul className="ml-4 list-disc">
                      {course.professorPreference.avoidedStaff.map(
                        (assistant) => (
                          <li key={assistant.id}>{assistant.name}</li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No avoided assistants
                    </p>
                  )}

                  <h4 className="mt-2 font-medium">
                    Required availability for Assistants
                  </h4>
                  {course.professorPreference?.timesRequired?.length ? (
                    <div className="pointer-events-none max-w-[800px]">
                      <BaseScheduleSelector
                        selection={timesRequiredToDate(
                          course.professorPreference.timesRequired,
                          calendarStart,
                        )}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No required times</p>
                  )}
                  <h4 className="mt-2 font-medium">Comments</h4>
                  {course.professorPreference?.comments?.length ? (
                    <div className="ml-4 list-disc">
                      {course.professorPreference.comments}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No comments</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
