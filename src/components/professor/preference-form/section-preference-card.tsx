/* "use client";

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

  );
};

export default SectionPreferenceCard; */
