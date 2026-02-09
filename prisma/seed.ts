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
    prisma.allowedTermUser.deleteMany(),
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
      active: true,
      published: true,
    },
  });

  // ----- USERS -----
  const [
    professor,
    ahrens,
    ta,
    pla,
    pla2,
    coordinator,
    testprof,
    prof2,
    prof3,
    prof4,
    prof5,
    prof6,
  ] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Prof. Discrete",
        email: "prof.discrete@wpi.edu",
      },
    }),
    prisma.user.create({
      data: {
        name: "Matthew Ahrens",
        email: "mahrens@wpi.edu",
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
    prisma.user.create({
      data: {
        name: "Test Professor",
        email: "testprof@wpi.edu",
      },
    }),
    prisma.user.create({
      data: {
        name: "Prof. Johnson",
        email: "prof.johnson@wpi.edu",
      },
    }),
    prisma.user.create({
      data: {
        name: "Prof. Smith",
        email: "prof.smith@wpi.edu",
      },
    }),
    prisma.user.create({
      data: {
        name: "Prof. Davis",
        email: "prof.davis@wpi.edu",
      },
    }),
    prisma.user.create({
      data: {
        name: "Prof. Martinez",
        email: "prof.martinez@wpi.edu",
      },
    }),
    prisma.user.create({
      data: {
        name: "Prof. Anderson",
        email: "prof.anderson@wpi.edu",
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
      { userId: testprof.id, role: Role.PROFESSOR },
      { userId: prof2.id, role: Role.PROFESSOR },
      { userId: prof3.id, role: Role.PROFESSOR },
      { userId: prof4.id, role: Role.PROFESSOR },
      { userId: prof5.id, role: Role.PROFESSOR },
      { userId: prof6.id, role: Role.PROFESSOR },
    ],
  });

  // ----- ALLOWED EMAILS FOR THIS TERM -----
  await prisma.allowedTermUser.createMany({
    data: [
      {
        userId: professor.id,
        termId: term.id,
      },
      {
        userId: ta.id,
        termId: term.id,
      },
      {
        userId: pla.id,
        termId: term.id,
      },
      {
        userId: pla2.id,
        termId: term.id,
      },
      {
        userId: coordinator.id,
        termId: term.id,
      },
      {
        userId: testprof.id,
        termId: term.id,
      },
      {
        userId: prof2.id,
        termId: term.id,
      },
      {
        userId: prof3.id,
        termId: term.id,
      },
      {
        userId: prof4.id,
        termId: term.id,
      },
      {
        userId: prof5.id,
        termId: term.id,
      },
      {
        userId: prof6.id,
        termId: term.id,
      },
    ],
  });

  // ----- SECTIONS -----
  const [
    discrete,
    discrete2,
    algorithms,
    dataStructures,
    operatingSystems,
    databases,
    softwareEngineering,
    webDev,
    machineLearning,
    compGraphics,
    compSecurity,
    artificialIntelligence,
  ] = await Promise.all([
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Discrete Mathematics",
        courseCode: "CS 2022",
        description: "Intro to discrete math: sets, logic, relations, graphs.",
        professorId: testprof.id,
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
        courseTitle: "Discrete Mathematics",
        courseCode: "CS 2022",
        description: "Intro to discrete math: sets, logic, relations, graphs.",
        professorId: testprof.id,
        courseSection: "LO3",
        enrollment: 80,
        capacity: 90,
        requiredHours: 40,
        academicLevel: AcademicLevel.UNDERGRADUATE,
        meetingPattern: "m t r f",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Algorithms",
        courseCode: "CS 3013",
        courseSection: "LO2",
        description: "Design and analysis of algorithms.",
        professorId: testprof.id,
        enrollment: 30,
        capacity: 35,
        requiredHours: 10,
        academicLevel: AcademicLevel.UNDERGRADUATE,
        meetingPattern: "m t r",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Data Structures",
        courseCode: "CS 2102",
        courseSection: "A01",
        description: "Fundamental data structures and algorithms.",
        professorId: prof2.id,
        enrollment: 60,
        capacity: 70,
        requiredHours: 20,
        academicLevel: AcademicLevel.UNDERGRADUATE,
        meetingPattern: "m w f",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Operating Systems",
        courseCode: "CS 3013",
        courseSection: "B01",
        description: "Operating system design and implementation.",
        professorId: prof3.id,
        enrollment: 45,
        capacity: 50,
        requiredHours: 15,
        academicLevel: AcademicLevel.UNDERGRADUATE,
        meetingPattern: "t r",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Database Systems",
        courseCode: "CS 3431",
        courseSection: "C01",
        description: "Database design and implementation principles.",
        professorId: prof4.id,
        enrollment: 35,
        capacity: 40,
        requiredHours: 10,
        academicLevel: AcademicLevel.UNDERGRADUATE,
        meetingPattern: "m w",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Software Engineering",
        courseCode: "CS 3733",
        courseSection: "D01",
        description:
          "This course covers the data structures and general program-design material from CS 2102, but assumes that students have significant prior experience in object-oriented programming. The course covers object-oriented design principles and data structures more deeply and at a faster pace than in CS 2102. Students will be expected to design, implement, test, debug, and critique programs both for correctness and adherence to good object-oriented design principles. The course is designed to strengthen both the design skills and algorithmic thinking of students who already have a foundation in object-oriented programming. Recommended background: CS 1101 or CS 1102 and significant prior experience writing object-oriented programs from scratch. Advanced Placement Computer Science A courses should provide sufficient background; students from AP CS Principles courses or gentler introductions to Java Programming are advised to take CS 2102 instead. Students may receive credit for only one of the following three courses: CS 2102, CS 210X, CS 2103. ",
        professorId: prof5.id,
        enrollment: 50,
        capacity: 60,
        requiredHours: 20,
        academicLevel: AcademicLevel.UNDERGRADUATE,
        meetingPattern: "t r f",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Web Development",
        courseCode: "CS 4241",
        courseSection: "E01",
        description: "Modern web application development.",
        professorId: prof6.id,
        enrollment: 40,
        capacity: 45,
        requiredHours: 15,
        academicLevel: AcademicLevel.UNDERGRADUATE,
        meetingPattern: "m w f",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Machine Learning",
        courseCode: "CS 4342",
        courseSection: "F01",
        description: "Introduction to machine learning algorithms.",
        professorId: prof2.id,
        enrollment: 55,
        capacity: 60,
        requiredHours: 20,
        academicLevel: AcademicLevel.GRADUATE,
        meetingPattern: "t r",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Computer Graphics",
        courseCode: "CS 4731",
        courseSection: "G01",
        description: "3D graphics rendering and animation.",
        professorId: prof3.id,
        enrollment: 25,
        capacity: 30,
        requiredHours: 10,
        academicLevel: AcademicLevel.GRADUATE,
        meetingPattern: "m w",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Computer Security",
        courseCode: "CS 4401",
        courseSection: "H01",
        description: "Cryptography and network security.",
        professorId: prof4.id,
        enrollment: 30,
        capacity: 35,
        requiredHours: 10,
        academicLevel: AcademicLevel.GRADUATE,
        meetingPattern: "t r",
      },
    }),
    prisma.section.create({
      data: {
        termId: term.id,
        courseTitle: "Artificial Intelligence",
        courseCode: "CS 4341",
        courseSection: "I01",
        description: "AI algorithms and intelligent systems.",
        professorId: prof5.id,
        enrollment: 50,
        capacity: 55,
        requiredHours: 20,
        academicLevel: AcademicLevel.GRADUATE,
        meetingPattern: "m w f",
      },
    }),
  ]);

  // ----- STAFF PREFERENCES (TA) -----
  const taStaffPref = await prisma.staffPreference.create({
    data: {
      userId: ta.id,
      termId: term.id,
      comments: "Prefer morning labs.",
      timesAvailable: {
        create: [{ day: "F", hour: 12 }],
      },
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
  /* const profPref = await prisma.professorPreference.create({
    data: {
      sectionId: discrete.id,
      comments: "Need strong discrete background.",
      timesRequired: {
        create: [
          { day: "F", hour: 11 },
          { day: "F", hour: 12 },
        ],
      },
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
  }); */

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
  console.log("Seeded users:", {
    professor,
    ta,
    pla,
    coordinator,
    testprof,
    prof2,
    prof3,
    prof4,
    prof5,
    prof6,
  });
  console.log("Seeded 12 sections:", {
    discrete,
    discrete2,
    algorithms,
    dataStructures,
    operatingSystems,
    databases,
    softwareEngineering,
    webDev,
    machineLearning,
    compGraphics,
    compSecurity,
    artificialIntelligence,
  });
  console.log("Seeded staff prefs:", { taStaffPref, plaStaffPref });
  // console.log("Seeded professor pref:", profPref);
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
