import { AcademicLevel, TermLetter } from "@prisma/client";
import { db } from "@/lib/db";

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
  const match = enrolledCapacity.match(/(\d+)\/(\d+)/);
  if (match) {
    return {
      enrolled: parseInt(match[1] ?? "0", 10),
      capacity: parseInt(match[2] ?? "0", 10),
    };
  }
  return { enrolled: 0, capacity: 0 };
}

function extractCourseCode(courseSection: string): string {
  const match = courseSection.match(/^([A-Z]+\s+\d+)/);
  return match?.[1] ?? courseSection;
}

function parseTermLetter(termType: string): TermLetter | null {
  const normalized = termType.trim().toUpperCase();
  // Match exact term patterns: "A Term", "B Term", etc.
  if (normalized.match(/\bA\s*TERM\b/)) return TermLetter.A;
  if (normalized.match(/\bB\s*TERM\b/)) return TermLetter.B;
  if (normalized.match(/\bC\s*TERM\b/)) return TermLetter.C;
  if (normalized.match(/\bD\s*TERM\b/)) return TermLetter.D;
  return null;
}

function parseYear(offeringPeriod: string): number | null {
  // Extract year from formats like "2025 Fall B Term" or "2026 Spring C Term"
  const match = offeringPeriod.match(/(\d{4})/);
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
    const data = await response.json();

    // Filter to CS courses only
    return data.Report_Entry.filter(
      (entry: WPICourseEntry) =>
        entry.Subject === "Computer Science" ||
        entry.Course_Section?.startsWith("CS "),
    );
  } catch (error) {
    console.error("Error fetching WPI courses:", error);
    throw error;
  }
}

async function findOrCreateProfessor(instructorName: string) {
  if (!instructorName || instructorName.trim() === "") {
    // Create or get "Unknown Professor" placeholder
    let unknown = await prisma.user.findFirst({
      where: { name: "Unknown Professor" },
    });

    if (!unknown) {
      unknown = await prisma.user.create({
        data: {
          name: "Unknown Professor",
          email: "unknown@wpi.edu",
          roles: {
            create: { role: "PROFESSOR" },
          },
        },
      });
    }

    return unknown;
  }

  // Try to find existing professor by name
  let professor = await prisma.user.findFirst({
    where: {
      name: instructorName,
      roles: {
        some: { role: "PROFESSOR" },
      },
    },
  });

  // If not found, create new professor
  if (!professor) {
    const emailUsername = instructorName.toLowerCase().replace(/\s+/g, ".");
    professor = await prisma.user.create({
      data: {
        name: instructorName,
        email: `${emailUsername}@wpi.edu`,
        roles: {
          create: { role: "PROFESSOR" },
        },
      },
    });
    console.log(`Created new professor: ${instructorName}`);
  }

  return professor;
}

async function findOrCreateTerm(termLetter: TermLetter, year: number) {
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

export async function syncCourses() {
  console.log("Starting course sync...");

  try {
    const wpiCourses = await fetchWPICourses();
    console.log(`Fetched ${wpiCourses.length} CS courses from WPI`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    console.log(`Processing ${wpiCourses.length} courses...`);

    for (const course of wpiCourses) {
      try {
        // Dude where is 1101
        if (course.Course_Section.startsWith("CS 1101")) {
          console.log(`\nProcessing: ${course.Course_Section}`);
          console.log(`  Instructor: "${course.Instructors}"`);
          console.log(`  Status: ${course.Section_Status}`);
          console.log(`  Term Type: ${course.Starting_Academic_Period_Type}`);
          console.log(`  Offering: ${course.Offering_Period}`);
        }

        // Skip waitlist sections, interest lists, and courses without instructors
        if (
          course.Course_Section.includes("Interest List") ||
          course.Course_Section.includes("Waitlist") ||
          !course.Instructors ||
          course.Instructors.trim() === "" ||
          course.Section_Status === "Waitlist"
        ) {
          if (course.Course_Section.startsWith("CS 1101")) {
            console.log(`  -> SKIPPED (filter)`);
          }
          skipped++;
          continue;
        }

        const termLetter = parseTermLetter(
          course.Starting_Academic_Period_Type,
        );
        const year = parseYear(course.Offering_Period);

        if (!termLetter || !year) {
          console.log(
            `Skipping course ${course.Course_Section}: Invalid term/year`,
          );
          skipped++;
          continue;
        }

        const term = await findOrCreateTerm(termLetter, year);
        const professor = await findOrCreateProfessor(course.Instructors);
        const { enrolled, capacity } = parseEnrollment(
          course.Enrolled_Capacity,
        );
        const courseCode = extractCourseCode(course.Course_Section);

        // Extract title (remove course code prefix if present)
        const courseTitle = course.Course_Title.replace(
          /^[A-Z]+\s+\d+\s+-\s+/,
          "",
        );

        // Estimate required hours: 1 hour per 20 students, minimum 2 hours
        const requiredHours = Math.max(2, Math.ceil(enrolled / 20));

        // Check if section already exists (use full Course_Section as unique identifier)
        const existingSection = await prisma.section.findFirst({
          where: {
            courseCode: course.Course_Section,
            termId: term.id,
          },
        });

        if (existingSection) {
          // Update existing section
          await prisma.section.update({
            where: { id: existingSection.id },
            data: {
              courseTitle,
              enrollment: enrolled,
              capacity,
              requiredHours,
              professorId: professor.id,
              academicLevel: parseAcademicLevel(course.Academic_Level),
              description: course.Course_Description || "",
            },
          });
          updated++;
        } else {
          // Create new section
          await prisma.section.create({
            data: {
              termId: term.id,
              courseCode: course.Course_Section,
              courseTitle,
              description: course.Course_Description || "",
              professorId: professor.id,
              enrollment: enrolled,
              capacity,
              requiredHours,
              academicLevel: parseAcademicLevel(course.Academic_Level),
            },
          });
          created++;
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
    console.log(`Skipped: ${skipped}`);

    return { created, updated, skipped };
  } catch (error) {
    console.error("Sync failed:", error);
    throw error;
  }
}

// Allow running directly with: npx tsx src/scripts/syncCourses.ts
if (require.main === module) {
  syncCourses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
