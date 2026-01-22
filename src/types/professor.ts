export type WeeklySlot = { day: "M" | "T" | "W" | "R" | "F"; hour: number };
export type dayEnum = { day: "M" | "T" | "W" | "R" | "F" };
export type Role = "TA" | "PLA" | "GLA" | "PROFESSOR" | "COORDINATOR";

export type SectionWithProfessorPreference = {
  sectionId: string;
  courseCode: string;
  courseSection: string;
  courseTitle: string;
  meetingPattern: string;
  enrollment: number;
  capacity: number;
  requiredHours: number;
  availableAssistants: Assistant[];
  professorPreference: {
    preferredStaff: Assistant[];
    avoidedStaff: Assistant[];
    timesRequired: {
      id: string;
      day: dayEnum;
      hour: number;
    }[];
    comments: string | null | undefined;
  };
};

export type SelectAssistantPreferenceProps = {
  sectionId: string;
  availableAssistants: Assistant[];
  chosenAssistants: Assistant[];
};

export type SelectRequiredTimesProps = {
  sectionId: string;
  timesRequired: WeeklySlot[];
  initialSelection?: Date[];
};

export type ProfessorCommentBoxProps = {
  sectionId: string;
  initialComment: string | undefined | null;
};

export type Assistant = {
  id: string;
  name: string | null;
  email: string | null;
  hours: number | null;
  roles: { role: Role }[] | undefined;
};
