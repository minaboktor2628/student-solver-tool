"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type React from "react";
import type {
  SectionWithProfessorPreference,
  Assistant,
} from "@/types/professor";
import { SelectAssistantPref } from "./select-assistant-pref";
import { SelectAssistantAntipref } from "./select-assistant-antipref";
import { SelectRequiredTimes } from "./select-required-times";
import { FormEntryComments } from "./comment-box";

export type SectionPreferenceCardProps = {
  sectionId: string;
  courseCode: string;
  courseTitle: string;
  meetingPattern: string;
  courseSection: string;
  enrollment: number;
  capacity: number;
  requiredHours: number;
  availableAssistants: Assistant[];
  value: SectionWithProfessorPreference["professorPreference"];
  onChange: (
    data: Partial<SectionWithProfessorPreference["professorPreference"]>,
  ) => void;
};

export const SectionPreferenceCard: React.FC<SectionPreferenceCardProps> = ({
  sectionId,
  courseCode,
  courseTitle,
  meetingPattern,
  courseSection,
  enrollment,
  capacity,
  requiredHours,
  availableAssistants,
  value,
  onChange,
}) => {
  return (
    <Card key={sectionId}>
      <CardHeader>
        <CardTitle>{courseTitle}</CardTitle>
        <CardDescription>
          {courseCode} - {courseSection}
        </CardDescription>
        <CardDescription>Meeting Time: {meetingPattern}</CardDescription>
        <CardDescription>
          Enrollment: {enrollment} / {capacity}
        </CardDescription>
        <CardDescription>
          Potential Staff Hours: {requiredHours}
        </CardDescription>
        <SelectAssistantPref
          key={sectionId}
          sectionId={sectionId}
          availableAssistants={availableAssistants}
          chosenAssistants={value.preferredStaff}
        />
        <SelectAssistantAntipref
          key={sectionId + "-anti"}
          sectionId={sectionId}
          availableAssistants={availableAssistants}
          chosenAssistants={value.avoidedStaff}
        />
        <SelectRequiredTimes
          sectionId={sectionId}
          timesRequired={value.timesRequired}
        />
        <FormEntryComments
          sectionId={sectionId}
          initialComment={value.comments}
        />
      </CardHeader>
    </Card>
  );
};

export default SectionPreferenceCard;
