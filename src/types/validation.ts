export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Person {
  First: string;
  Last: string;
  Email: string;
  Type: 'PLA' | 'TA' | 'GLA';
  Preferences?: Record<string, boolean>;
}

export interface Course {
  AcademicPeriod: string;
  Section: {
    Course: string;
    Subsection: string;
  };
  Enrollment: number;
  Instructors: string;
  RequiredHours?: number;
}

export interface Assignment {
  AcademicPeriod: string;
  Section: {
    Course: string;
    Subsection: string;
  };
  TAs: Array<{
    First: string;
    Last: string;
    Locked: boolean;
    Hours: number;
  }>;
  PLAs: Array<{
    First: string;
    Last: string;
    Locked: boolean;
    Hours: number;
  }>;
  GLAs: Array<{
    First: string;
    Last: string;
    Locked: boolean;
    Hours: number;
  }>;
}

export interface ValidationInput {
  PLA_Preferences: Person[];
  TA_Preferences: Person[];
  Assignments: Assignment[];
}