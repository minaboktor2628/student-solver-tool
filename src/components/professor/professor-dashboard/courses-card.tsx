"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BaseScheduleSelector, slotToDate } from "@/lib/schedule-selector";
import { api } from "@/trpc/react";

type CoursesCardProps = {
  isSubmitted: boolean;
  professorId: string;
  termId: string;
};
export const CoursesCard: React.FC<CoursesCardProps> = ({
  isSubmitted,
  termId,
  professorId,
}) => {
  const [{ sections }] =
    api.professorForm.getProfessorSectionsForTerm.useSuspenseQuery({
      professorId,
      termId,
    });

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
          {Object.values(sections ?? {}).map((course) => (
            <div key={course.sectionId} className="rounded-lg border p-4">
              <h3 className="font-semibold">
                {course.courseCode}-{course.courseSection} -{" "}
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
                        selection={course.professorPreference.timesRequired.map(
                          slotToDate,
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
