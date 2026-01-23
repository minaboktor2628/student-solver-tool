export type WeeklySlot = { day: "M" | "T" | "W" | "R" | "F"; hour: number };
export type dayEnum = "M" | "T" | "W" | "R" | "F";
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
    preferredStaff?: Assistant[];
    avoidedStaff?: Assistant[];
    timesRequired?: TimesRequiredOutput[];
    comments?: string | null;
  };
};

export type Assistant = {
  id: string;
  name: string | null;
  email: string | null;
  hours: number | null;
  roles: { role: Role }[];
};

export type TimesRequiredOutput = {
  day: dayEnum;
  hour: number;
};
