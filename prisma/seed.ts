import { PrismaClient, AcademicLevel, Role, TermLetter } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Start from a clean slate (for dev only!)
  await prisma.$transaction([
    prisma.sectionAssignment.deleteMany(),
    prisma.professorPreferencePreferredStaff.deleteMany(),
    prisma.professorPreferenceAvoidedStaff.deleteMany(),
    prisma.professorPreference.deleteMany(),
    prisma.staffPreferencePreferredSection.deleteMany(),
    prisma.staffPreferenceQualifiedSection.deleteMany(),
    prisma.staffPreference.deleteMany(),
    prisma.allowedEmail.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.section.deleteMany(),
    prisma.term.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ----- TERM -----
  const term = await prisma.term.create({
    data: {
      id: "cmidsm56y0000v8vaqgdz42sc",
      termLetter: TermLetter.A,
      year: 2025,
      termStaffDueDate: new Date("2025-08-15T23:59:59Z"),
      termProfessorDueDate: new Date("2025-08-10T23:59:59Z"),
    },
  });

  // ----- USERS -----
  const [professor, ta, pla, pla2, coordinator] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Prof. Discrete",
        email: "prof.discrete@wpi.edu",
      },
    }),
    prisma.user.create({
      data: {
        name: "Taylor TA",
        email: "ta.taylor@wpi.edu",
        hours: 20,
      },
    }),
    prisma.user.create({
      data: {
        name: "Pat PLA",
        email: "pla.pat@wpi.edu",
        hours: 10,
      },
    }),
    prisma.user.create({
      data: {
        name: "Mat PLA",
        email: "pla.mat@wpi.edu",
        hours: 10,
      },
    }),
    prisma.user.create({
      data: {
        name: "Casey Coordinator",
        email: "coordinator.casey@wpi.edu",
      },
    }),
  ]);

  // ----- ROLES -----
  await prisma.userRole.createMany({
    data: [
      { userId: professor.id, role: Role.PROFESSOR },
      { userId: ta.id, role: Role.TA },
      { userId: pla.id, role: Role.PLA },
      { userId: pla2.id, role: Role.PLA },
      { userId: coordinator.id, role: Role.COORDINATOR },
    ],
  });

  // ----- ALLOWED EMAILS FOR THIS TERM -----
  await prisma.allowedEmail.createMany({
    data: [
      {
        email: professor.email!,
        role: Role.PROFESSOR,
        termId: term.id,
      },
      {
        email: ta.email!,
        role: Role.TA,
        termId: term.id,
      },
      {
        email: pla.email!,
        role: Role.PLA,
        termId: term.id,
      },
      {
        email: pla2.email!,
        role: Role.PLA,
        termId: term.id,
      },
      {
        email: coordinator.email!,
        role: Role.COORDINATOR,
        termId: term.id,
      },
    ],
  });

  // ----- SECTIONS -----
  const [discrete, algorithms] = await Promise.all([
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Discrete Mathematics",
        courseCode: "CS 2022",
        description: "Intro to discrete math: sets, logic, relations, graphs.",
        professorId: professor.id,
        courseSection: "LO2",
        enrollment: 40,
        capacity: 45,
        requiredHours: 20,
        academicLevel: AcademicLevel.UNDERGRADUATE,
        meetingPattern: "m t r",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Algorithms",
        courseCode: "CS 3013",
        courseSection: "LO2",
        description: "Design and analysis of algorithms.",
        professorId: professor.id,
        enrollment: 30,
        capacity: 35,
        requiredHours: 10,
        academicLevel: AcademicLevel.UNDERGRADUATE,
        meetingPattern: "m t r",
      },
    }),
  ]);

  // ----- STAFF PREFERENCES (TA) -----
  const taStaffPref = await prisma.staffPreference.create({
    data: {
      userId: ta.id,
      termId: term.id,
      comments: "Prefer morning labs.",
      qualifiedForSections: {
        create: [{ sectionId: discrete.id }, { sectionId: algorithms.id }],
      },
      preferredSections: {
        create: [
          { sectionId: discrete.id, rank: "PREFER" },
          { sectionId: algorithms.id, rank: "STRONGLY_PREFER" },
        ],
      },
    },
    include: {
      qualifiedForSections: true,
      preferredSections: true,
    },
  });

  // ----- STAFF PREFERENCES (PLA) -----
  const plaStaffPref = await prisma.staffPreference.create({
    data: {
      userId: pla.id,
      termId: term.id,
      comments: "Cannot work Fridays.",
      qualifiedForSections: {
        create: [{ sectionId: discrete.id }],
      },
      preferredSections: {
        create: [{ sectionId: discrete.id, rank: "STRONGLY_PREFER" }],
      },
    },
  });
  const plaStaffPref2 = await prisma.staffPreference.create({
    data: {
      userId: pla2.id,
      termId: term.id,
      comments: "Cannot work Fridays.",
      qualifiedForSections: {
        create: [{ sectionId: discrete.id }],
      },
      preferredSections: {
        create: [{ sectionId: discrete.id, rank: "PREFER" }],
      },
    },
  });

  // ----- PROFESSOR PREFERENCES FOR DISCRETE -----
  const profPref = await prisma.professorPreference.create({
    data: {
      sectionId: discrete.id,
      comments: "Need strong discrete background.",
      preferredStaff: {
        create: [
          { staffId: ta.id }, // professor prefers this TA
        ],
      },
      avoidedStaff: {
        create: [
          { staffId: pla.id }, // professor does NOT want this PLA
        ],
      },
    },
    include: {
      preferredStaff: true,
      avoidedStaff: true,
    },
  });

  // ----- ACTUAL ASSIGNMENTS -----
  await prisma.sectionAssignment.createMany({
    data: [
      {
        sectionId: algorithms.id,
        staffId: ta.id,
      },
    ],
  });

  console.log("Seeded term:", term);
  console.log("Seeded users:", { professor, ta, pla, coordinator });
  console.log("Seeded sections:", { discrete, algorithms });
  console.log("Seeded staff prefs:", { taStaffPref, plaStaffPref });
  console.log("Seeded professor pref:", profPref);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
