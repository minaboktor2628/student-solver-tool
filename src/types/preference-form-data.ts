export type Course = {
  department: string;
  course_number: string;
};

export type MultiStepFormData = {
  available: boolean | null;
  times_available: string[]; //TODO: regex or type this
  qualified_courses: Course[];
  preferred_courses: Course[];
  comments: string;
};
