import type { Day } from "@prisma/client";

export type WeeklySlot = { day: "M" | "T" | "W" | "R" | "F"; hour: number };
export type Role = "TA" | "PLA" | "GLA" | "PROFESSOR" | "COORDINATOR";

export type ProfessorSection = {
  sectionId: string;
  courseCode: string;
  courseSection: string;
  courseTitle: string;
  meetingPattern: string;
  enrollment: number;
  capacity: number;
  requiredHours: number;
  availableAssistants: {
    name: string | null;
    id: string;
    email: string | null;
    hours: number | null;
    roles: {
      role: Role;
    }[];
  }[];
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
    timesRequired: {
      id: string;
      day: Day;
      hour: number;
    }[];
    comments: string | null | undefined;
  };
};

export type Assistant = {
  id: string;
  name: string | null;
  email: string | null;
  hours: number | null;
  roles: Role[];
};

export type TimesRequiredOutput = {
  day: Day;
  hour: number;
};
