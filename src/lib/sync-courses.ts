import { AcademicLevel, TermLetter } from "@prisma/client";
import type { User, Term } from "@prisma/client";
import { db } from "@/server/db";
import { calculateRequiredHours } from "@/lib/utils";

const prisma = db;

interface WPICourseEntry {
  Course_Section: string;
  Course_Title: string;
  Course_Description?: string;
  Enrolled_Capacity: string;
  Offering_Period: string;
  Starting_Academic_Period_Type: string;
  Instructors: string;
  Academic_Level: string;
  Subject: string;
  Section_Status?: string;
}

function parseEnrollment(enrolledCapacity: string): {
  enrolled: number;
  capacity: number;
} {
  const match = /(\d+)\/(\d+)/.exec(enrolledCapacity);
  if (match) {
    return {
      enrolled: parseInt(match[1] ?? "0", 10),
      capacity: parseInt(match[2] ?? "0", 10),
    };
  }
  return { enrolled: 0, capacity: 0 };
}

function extractCourseCode(courseSection: string): string {
  const match = /^([A-Z]+\s+\d+)/.exec(courseSection);
  return match?.[1] ?? courseSection;
}

function extractSectionType(courseSection: string): string | null {
  // Look for patterns like: CS 3041-D02, CS 3041 D02, CS 3041-DL01, etc.
  // First try to find section after the last space or hyphen before the dash in title
  const match = /[-\s]([A-Z]{1,2}\d+)\b/.exec(courseSection);
  return match?.[1] ?? null;
}

function isGraduateCourse(courseSection: string): boolean {
  const match = /CS\s*(\d+)/.exec(courseSection);
  if (match) {
    const courseNumber = parseInt(match[1] ?? "0", 10);
    // Graduate course numbers: 500-599, 5000-5999, 600-699, 6000-6999
    return (
      (courseNumber >= 500 && courseNumber <= 599) ||
      (courseNumber >= 5000 && courseNumber <= 5999) ||
      (courseNumber >= 600 && courseNumber <= 699) ||
      (courseNumber >= 6000 && courseNumber <= 6999)
    );
  }
  return false;
}

function isLectureSection(courseSection: string): boolean {
  const sectionType = extractSectionType(courseSection);

  // If no section type found (e.g., just "CS 1004"), it's a bare course - exclude it
  if (!sectionType) {
    return false;
  }

  // Check if this is a graduate course
  const isGradCourse = isGraduateCourse(courseSection);

  if (isGradCourse) {
    // For graduate courses, accept more section types
    // Common grad patterns: S01, G01, M01, etc.
    const gradPattern = /^[A-Z]\d+$/;
    const isGradSection = gradPattern.test(sectionType);
    const isLab = /X\d+$/.test(sectionType); // Still exclude labs (X01, etc.)

    return isGradSection && !isLab;
  } else {
    // Undergraduate courses use original logic
    const lecturePattern = /^([ABCD]L\d+|[ABCD]\d+)$/;
    const labPattern = /^[ABCD][XD]\d+$/;

    const isLecture = lecturePattern.test(sectionType);
    const isLab = labPattern.test(sectionType);
    return isLecture && !isLab;
  }
}

function parseTermLetter(termType: string): TermLetter | null {
  const normalized = termType.trim().toUpperCase();

  // Match exact term patterns: "A Term", "B Term", etc.
  if (/\bA\s*TERM\b/.exec(normalized)) return TermLetter.A;
  if (/\bB\s*TERM\b/.exec(normalized)) return TermLetter.B;
  if (/\bC\s*TERM\b/.exec(normalized)) return TermLetter.C;
  if (/\bD\s*TERM\b/.exec(normalized)) return TermLetter.D;

  // Graduate semesters - map to first term of semester
  if (normalized.includes("FALL") || normalized.includes("FALL SEMESTER")) {
    return TermLetter.A; // Fall semester = A term (spans A+B)
  }

  if (normalized.includes("SPRING") || normalized.includes("SPRING SEMESTER")) {
    return TermLetter.C; // Spring semester = C term (spans C+D)
  }

  return null;
}

function parseYear(offeringPeriod: string): number | null {
  // Extract year from formats like "2025 Fall B Term" or "2026 Spring C Term"
  const match = /(\d{4})/.exec(offeringPeriod);
  return match ? parseInt(match[1] ?? "0", 10) : null;
}

function parseAcademicLevel(level: string): AcademicLevel {
  return level === "Graduate"
    ? AcademicLevel.GRADUATE
    : AcademicLevel.UNDERGRADUATE;
}

async function fetchWPICourses(): Promise<WPICourseEntry[]> {
  try {
    const response = await fetch(
      "https://courselistings.wpi.edu/assets/prod-data.json",
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as {
      Report_Entry?: WPICourseEntry[];
    };
    const reportEntries = data.Report_Entry ?? [];

    // Filter to CS courses only (including graduate courses)
    return reportEntries.filter((entry: WPICourseEntry) => {
      // Check if Subject contains "Computer Science"
      if (entry.Subject?.includes("Computer Science")) return true;

      const courseSection = entry.Course_Section ?? "";
      // Match: CS 1000, CS500, CS 500, CS5003, CS 5003, CS600, CS 600, etc.
      return /^CS\s*\d+/.test(courseSection);
    });
  } catch (error) {
    console.error("Error fetching WPI courses:", error);
    throw error;
  }
}

async function findOrCreateProfessor(instructorName: string): Promise<User> {
  if (!instructorName || instructorName.trim() === "") {
    // Create or get "Unknown Professor" placeholder
    let unknown = await prisma.user.findFirst({
      where: { name: "Unknown Professor" },
    });

    unknown ??= await prisma.user.create({
      data: {
        name: "Unknown Professor",
        email: "unknown@wpi.edu",
        roles: {
          create: { role: "PROFESSOR" },
        },
      },
    });

    return unknown;
  }

  // Try to find existing professor by name
  const professor = await prisma.user.findFirst({
    where: {
      name: instructorName,
      roles: {
        some: { role: "PROFESSOR" },
      },
    },
  });

  // If not found, throw an error so coordinator can add them properly
  if (!professor) {
    throw new Error(
      `Professor "${instructorName}" not found in database. Please add this professor through the Users page before syncing courses.`,
    );
  }

  return professor;
}

async function findOrCreateTerm(
  termLetter: TermLetter,
  year: number,
): Promise<Term> {
  let term = await prisma.term.findUnique({
    where: {
      termLetter_year: { termLetter, year },
    },
  });

  if (!term) {
    // Create term with default due dates (can be updated later by coordinator)
    const defaultDueDate = new Date();
    defaultDueDate.setMonth(defaultDueDate.getMonth() + 1);

    term = await prisma.term.create({
      data: {
        termLetter,
        year,
        termStaffDueDate: defaultDueDate,
        termProfessorDueDate: defaultDueDate,
      },
    });
    console.log(`Created new term: ${termLetter} ${year}`);
  }

  return term;
}

async function createOrUpdateSection(
  termId: string,
  course: WPICourseEntry,
  professor: User,
  isPrimary: boolean,
  isGradSemester: boolean,
) {
  const { enrolled, capacity } = parseEnrollment(course.Enrolled_Capacity);
  const courseCode = extractCourseCode(course.Course_Section);
  const courseTitle = course.Course_Title.replace(/^[A-Z]+\s+\d+\s+-\s+/, "");
  const courseSection = extractSectionType(course.Course_Section) ?? "01";

  // Enhanced description
  let enhancedDescription = course.Course_Description ?? "";
  if (isGradSemester) {
    if (isPrimary) {
      enhancedDescription = `[GRAD_SEMESTER_PRIMARY - spans both terms] ${enhancedDescription}`;
    } else {
      enhancedDescription = `[GRAD_SEMESTER_SECONDARY - display only, see primary term for assignments] ${enhancedDescription}`;
    }
  }

  // Check if section already exists
  const existingSection = await prisma.section.findFirst({
    where: {
      courseCode: courseCode,
      termId: termId,
    },
  });

  const sectionData = {
    courseTitle,
    enrollment: enrolled,
    capacity,
    requiredHours: isPrimary ? calculateRequiredHours(enrolled) : 0,
    professorId: professor.id,
    academicLevel: parseAcademicLevel(course.Academic_Level),
    description: enhancedDescription,
    courseSection: courseSection,
    meetingPattern: "",
  };

  if (existingSection) {
    // Update
    await prisma.section.update({
      where: { id: existingSection.id },
      data: sectionData,
    });
    return { action: "updated", section: existingSection };
  } else {
    // Create
    const newSection = await prisma.section.create({
      data: {
        termId: termId,
        courseCode: courseCode,
        ...sectionData,
      },
    });
    return { action: "created", section: newSection };
  }
}

export async function syncCourses() {
  console.log("Starting course sync...");

  try {
    const wpiCourses = await fetchWPICourses();
    console.log(`Fetched ${wpiCourses.length} CS courses from WPI`);

    // Filter to lecture sections only and deduplicate by course code + term
    const lectureCoursesMap = new Map<string, WPICourseEntry>();

    console.log("\n=== FILTERING COURSES ===");
    let totalProcessed = 0;
    let filteredOutNotLecture = 0;
    let filteredOutWaitlist = 0;
    let filteredOutNoTerm = 0;

    // Sample some rejected courses to see why they're being filtered
    const rejectedSamples: string[] = [];
    const acceptedSamples: string[] = [];

    for (const course of wpiCourses) {
      totalProcessed++;

      // Skip if not a lecture section
      if (!isLectureSection(course.Course_Section)) {
        filteredOutNotLecture++;
        if (rejectedSamples.length < 10) {
          const sectionType = extractSectionType(course.Course_Section);
          rejectedSamples.push(
            `${course.Course_Section} (section type: ${sectionType})`,
          );
        }
        continue;
      }

      // Skip waitlist sections, interest lists, and courses without instructors
      if (
        course.Course_Section.includes("Interest List") ||
        course.Course_Section.includes("Waitlist") ||
        !course.Instructors ||
        course.Instructors.trim() === ""
      ) {
        filteredOutWaitlist++;
        continue;
      }

      const termLetter = parseTermLetter(course.Starting_Academic_Period_Type);
      const year = parseYear(course.Offering_Period);

      if (!termLetter || !year) {
        filteredOutNoTerm++;
        if (totalProcessed <= 5) {
          console.log(
            `No term/year for: ${course.Course_Section}, Type: "${course.Starting_Academic_Period_Type}", Period: "${course.Offering_Period}"`,
          );
        }
        continue;
      }

      const courseCode = extractCourseCode(course.Course_Section);
      const uniqueKey = `${courseCode}-${termLetter}-${year}`;

      // Keep first lecture section found for each course
      if (!lectureCoursesMap.has(uniqueKey)) {
        lectureCoursesMap.set(uniqueKey, course);
        if (acceptedSamples.length < 20) {
          const sectionType = extractSectionType(course.Course_Section);
          acceptedSamples.push(
            `${course.Course_Section} (section type: ${sectionType})`,
          );
        }
      }
    }

    console.log(`\nTotal WPI courses processed: ${totalProcessed}`);
    console.log(`Filtered out (not lecture): ${filteredOutNotLecture}`);
    console.log(
      `Filtered out (waitlist/no instructor): ${filteredOutWaitlist}`,
    );
    console.log(`Filtered out (no term/year): ${filteredOutNoTerm}`);
    console.log(`Unique lecture sections found: ${lectureCoursesMap.size}`);

    if (rejectedSamples.length > 0) {
      console.log("\n=== SAMPLE OF REJECTED SECTIONS ===");
      rejectedSamples.forEach((sample) => console.log(`  - ${sample}`));
    }

    if (acceptedSamples.length > 0) {
      console.log("\n=== SAMPLE OF ACCEPTED SECTIONS ===");
      acceptedSamples.forEach((sample) => console.log(`  - ${sample}`));
    }

    const lectureCourses = Array.from(lectureCoursesMap.values());
    console.log(`Filtered to ${lectureCourses.length} unique lecture sections`);

    // Build a map of terms we're syncing
    const termsBeingSynced = new Set<string>();
    for (const course of lectureCourses) {
      const termLetter = parseTermLetter(course.Starting_Academic_Period_Type);
      const year = parseYear(course.Offering_Period);
      if (termLetter && year) {
        termsBeingSynced.add(`${termLetter}-${year}`);
      }
    }

    // Get all existing sections from the database for terms we're syncing
    const existingSections = await prisma.section.findMany({
      include: {
        term: true,
      },
      where: {
        term: {
          OR: Array.from(termsBeingSynced).map((key) => {
            const [termLetter, year] = key.split("-");
            return {
              termLetter: termLetter as TermLetter,
              year: parseInt(year ?? "0"),
            };
          }),
        },
      },
    });

    // Build a set of valid course codes that should exist from WPI data
    const validCourseCodes = new Set<string>();
    for (const course of lectureCourses) {
      const termLetter = parseTermLetter(course.Starting_Academic_Period_Type);
      const year = parseYear(course.Offering_Period);
      if (termLetter && year) {
        const courseCode = extractCourseCode(course.Course_Section);
        validCourseCodes.add(`${courseCode}-${termLetter}-${year}`);
      }
    }

    // Delete sections that shouldn't exist (only for terms we're syncing)
    let deleted = 0;
    for (const section of existingSections) {
      const sectionKey = `${section.courseCode}-${section.term.termLetter}-${section.term.year}`;

      console.log(
        `Checking section: ${sectionKey}, Valid: ${validCourseCodes.has(sectionKey)}`,
      );

      // If this section is not in our valid set, delete it
      if (!validCourseCodes.has(sectionKey)) {
        await prisma.section.delete({
          where: { id: section.id },
        });
        deleted++;
        console.log(`❌ Deleted invalid section: ${section.courseCode}`);
      } else {
        console.log(`✅ Keeping valid section: ${section.courseCode}`);
      }
    }

    console.log(`\nDeleted ${deleted} invalid sections`);
    console.log(`Valid course codes in WPI data: ${validCourseCodes.size}`);
    console.log(`Existing sections checked: ${existingSections.length}`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    console.log(`\n=== PROCESSING ${lectureCourses.length} COURSES ===`);

    for (const course of lectureCourses) {
      try {
        const termLetter = parseTermLetter(
          course.Starting_Academic_Period_Type,
        );
        const year = parseYear(course.Offering_Period);

        if (!termLetter || !year) {
          console.log(`Skipping ${course.Course_Section}: no term/year`);
          skipped++;
          continue;
        }

        const professor = await findOrCreateProfessor(course.Instructors);
        const courseCode = extractCourseCode(course.Course_Section);

        // Determine if it's a graduate semester course
        const isGradCourse = isGraduateCourse(course.Course_Section);
        const isSemesterCourse =
          course.Offering_Period.includes("Semester") ||
          course.Starting_Academic_Period_Type.includes("Semester");

        // For graduate semester courses, create sections in both terms
        if (isGradCourse && isSemesterCourse) {
          // Determine primary and secondary terms
          let primaryTermLetter: TermLetter;
          let secondaryTermLetter: TermLetter;

          if (termLetter === TermLetter.A || termLetter === TermLetter.B) {
            // Fall semester - create in both A and B terms
            primaryTermLetter = TermLetter.A;
            secondaryTermLetter = TermLetter.B;
          } else {
            // Spring semester - create in both C and D terms
            primaryTermLetter = TermLetter.C;
            secondaryTermLetter = TermLetter.D;
          }

          // Create PRIMARY section (with actual hours) in primary term
          const primaryTerm = await findOrCreateTerm(primaryTermLetter, year);
          const primaryResult = await createOrUpdateSection(
            primaryTerm.id,
            course,
            professor,
            true, // isPrimary
            true, // isGradSemester
          );

          if (primaryResult.action === "created") {
            created++;
            if (created <= 5)
              console.log(
                `Created: ${courseCode} for ${primaryTermLetter} ${year} (grad semester primary)`,
              );
          } else {
            updated++;
            if (updated <= 5)
              console.log(
                `Updated: ${courseCode} for ${primaryTermLetter} ${year}`,
              );
          }

          // Create SECONDARY section (display only, 0 hours) in secondary term
          const secondaryTerm = await findOrCreateTerm(
            secondaryTermLetter,
            year,
          );
          const secondaryResult = await createOrUpdateSection(
            secondaryTerm.id,
            course,
            professor,
            false, // isPrimary
            true, // isGradSemester
          );

          if (secondaryResult.action === "created") {
            created++;
            if (created <= 5)
              console.log(
                `Created: ${courseCode} for ${secondaryTermLetter} ${year} (grad semester display-only)`,
              );
          } else {
            updated++;
            if (updated <= 5)
              console.log(
                `Updated: ${courseCode} for ${secondaryTermLetter} ${year}`,
              );
          }
        } else {
          // Regular course - create normally in its actual term
          const term = await findOrCreateTerm(termLetter, year);
          const result = await createOrUpdateSection(
            term.id,
            course,
            professor,
            true, // isPrimary
            false, // isGradSemester
          );

          if (result.action === "created") {
            created++;
            if (created <= 5)
              console.log(`Created: ${courseCode} for ${termLetter} ${year}`);
          } else {
            updated++;
            if (updated <= 5)
              console.log(`Updated: ${courseCode} for ${termLetter} ${year}`);
          }
        }
      } catch (error) {
        console.error(
          `Error processing course ${course.Course_Section}:`,
          error,
        );
        skipped++;
      }
    }

    console.log("\nSync complete!");
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Deleted: ${deleted}`);
    console.log(`Skipped: ${skipped}`);

    return { created, updated, skipped, deleted };
  } catch (error) {
    console.error("Sync failed:", error);
    throw error;
  }
}

// Allow running directly with: npx tsx src/lib/sync-courses.ts
if (require.main === module) {
  syncCourses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
