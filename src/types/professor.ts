export type WeeklySlot = { day: "M" | "T" | "W" | "R" | "F"; hour: number };
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
    preferredStaff:
      | {
          roles: Role[];
          name: string | null;
          id: string;
          email: string | null;
          hours: number | null;
        }[]
      | undefined;
    avoidedStaff:
      | {
          roles: Role[];
          name: string | null;
          id: string;
          email: string | null;
          hours: number | null;
        }[]
      | undefined;
    timesRequired: WeeklySlot[];
    comments: string | null | undefined;
  };
};

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
  initialComment: string;
};

export type Assistant = {
  id: string;
  name: string | null;
  email: string | null;
  roles: { role: Role }[];
};
