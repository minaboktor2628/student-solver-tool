import {
  CourseListingApiSchema,
  type ReportEntryRow,
} from "../types/courselisting-api";
import { AcademicLevel, TermLetter } from "@prisma/client";
import { calculateRequiredAssistantHours } from "./utils";
import z from "zod";

export const SectionItemSchema = z.object({
  academicLevel: z.nativeEnum(AcademicLevel),
  requiredHours: z.number(),
  capacity: z.number(),
  enrollment: z.number(),
  professorName: z.string(),
  courseCode: z.string(),
  courseTitle: z.string(),
  description: z.string(),
  courseSection: z.string(),
  meetingPattern: z.string(),
});

export type SectionItem = z.infer<typeof SectionItemSchema>;

// god i love a good pipeline
export async function getTermSectionData(
  year: number,
  term: TermLetter,
): Promise<SectionItem[]> {
  return fetchWPICourses()
    .then(filterNonCSCourses)
    .then(filterByTerm(year, term))
    .then(mapCourses);
}

async function fetchWPICourses() {
  try {
    const response = await fetch(
      "https://courselistings.wpi.edu/assets/prod-data.json",
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data, error } = CourseListingApiSchema.safeParse(
      await response.json(),
    );

    if (error) throw error;

    return data.Report_Entry;
  } catch (error) {
    console.error("Error fetching WPI courses:", error);
    throw error;
  }
}

function filterNonCSCourses(data: ReportEntryRow[]): ReportEntryRow[] {
  return data.filter((entry) => {
    const isLecture = entry.Instructional_Format === "Lecture";
    // FIX: double check this to be true
    const isCSDep =
      (entry.Subject.includes("Computer Science") ||
        entry.Course_Section_Owner === "Computer Science Department") &&
      entry.Course_Section.startsWith("CS ");

    return isLecture && isCSDep;
  });
}

function filterByTerm(year: number, term: TermLetter) {
  return function (data: ReportEntryRow[]) {
    const termPatterns: Record<TermLetter, string[]> = {
      A: [`${year} Fall A Term`, `${year} Fall Semester`],
      B: [`${year} Fall B Term`],
      C: [`${year} Spring C Term`, `${year} Spring Semester`],
      D: [`${year} Spring D Term`],
    };

    const patterns = termPatterns[term];

    return data.filter((entry) =>
      patterns.some((prefix) => entry.Offering_Period.startsWith(prefix)),
    );
  };
}

function mapCourses(data: ReportEntryRow[]): SectionItem[] {
  function extractCourseCode(courseSection: string): string {
    const match = /^([A-Z]+\s+\d+[A-Z]*)/.exec(courseSection);
    return match?.[1] ?? courseSection;
  }

  function extractSectionType(courseSection: string): string {
    // Look for patterns like: CS 3041-D02, CS 3041 D02, CS 3041-DL01, etc.
    const match = /[-\s]([A-Z]{1,2}\d+)\b/.exec(courseSection);
    return match?.[1] ?? "";
  }

  const sections: Array<SectionItem | null> = data.map((entry) => {
    // Enrollment / capacity, as numbers
    const [enrollmentStr, capacityStr] = (
      entry.Enrolled_Capacity ?? "0/0"
    ).split("/");
    const enrollment = Number(enrollmentStr) || 0;
    const capacity = Number(capacityStr) || 0;

    // if capacity is 0, something probably went wrong and we should skip this course
    if (capacity === 0) return null;

    const courseTitle = entry.Course_Title.replace(
      /^[A-Z]+\s+\d+[A-Z]*\s*-\s+/,
      "",
    );
    const courseCode = extractCourseCode(entry.Course_Section);
    const courseSection = extractSectionType(entry.Course_Section);
    const meetingPattern = entry.Meeting_Patterns;
    const description = entry.Course_Description;

    // Instructors
    const primaryInstructor = entry.Instructors?.split("; ")[0] ?? "";
    const [first, ...rest] = primaryInstructor.split(" ");
    const last = rest.join(" ");
    const professorName =
      first && last ? `${last}, ${first}` : primaryInstructor;

    const requiredHours = calculateRequiredAssistantHours(enrollment);

    const academicLevel: AcademicLevel =
      entry.Academic_Level === "Graduate" ? "GRADUATE" : "UNDERGRADUATE";

    return {
      courseTitle,
      courseCode,
      courseSection,
      meetingPattern,
      description,
      professorName: professorName === "" ? ("TBD" as const) : professorName,
      enrollment,
      capacity,
      requiredHours,
      academicLevel,
    };
  });

  // Type guard so TS knows nulls are gone
  return sections.filter((item): item is SectionItem => item !== null);
}

// for cli testing
// getTermSectionData(2026, "D")
//   .then((data) => {
//     console.log(data);
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
