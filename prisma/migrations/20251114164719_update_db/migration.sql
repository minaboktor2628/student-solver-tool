-- AlterTable
ALTER TABLE "User" ADD COLUMN "professorEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "staffEmail" TEXT;

-- CreateTable
CREATE TABLE "Term" (
    "letter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,

    PRIMARY KEY ("letter", "year")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "role" TEXT,
    "hours" INTEGER NOT NULL,
    CONSTRAINT "Staff_id_fkey" FOREIGN KEY ("id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    CONSTRAINT "Professor_id_fkey" FOREIGN KEY ("id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffFormInput" (
    "staffId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "termLetter" TEXT NOT NULL,
    "times" TEXT NOT NULL,
    "comments" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL,

    PRIMARY KEY ("staffId", "termLetter", "year"),
    CONSTRAINT "StaffFormInput_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StaffFormInput_termLetter_year_fkey" FOREIGN KEY ("termLetter", "year") REFERENCES "Term" ("letter", "year") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessorFormInput" (
    "professorId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "termLetter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "times" TEXT NOT NULL,
    "comments" TEXT NOT NULL,

    PRIMARY KEY ("professorId", "courseCode", "termLetter", "year"),
    CONSTRAINT "ProfessorFormInput_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfessorFormInput_courseCode_termLetter_year_fkey" FOREIGN KEY ("courseCode", "termLetter", "year") REFERENCES "Section" ("courseCode", "termLetter", "year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfessorFormInput_termLetter_year_fkey" FOREIGN KEY ("termLetter", "year") REFERENCES "Term" ("letter", "year") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessorPreference" (
    "professorId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "termLetter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "antiPreference" BOOLEAN NOT NULL,

    PRIMARY KEY ("professorId", "staffId", "termLetter", "year"),
    CONSTRAINT "ProfessorPreference_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfessorPreference_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfessorPreference_termLetter_year_fkey" FOREIGN KEY ("termLetter", "year") REFERENCES "Term" ("letter", "year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfessorPreference_professorId_termLetter_year_fkey" FOREIGN KEY ("professorId", "termLetter", "year") REFERENCES "ProfessorFormInput" ("professorId", "termLetter", "year") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Section" (
    "courseCode" TEXT NOT NULL,
    "termLetter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "enrollment" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "requiredHours" INTEGER NOT NULL,

    PRIMARY KEY ("courseCode", "termLetter", "year"),
    CONSTRAINT "Section_termLetter_year_fkey" FOREIGN KEY ("termLetter", "year") REFERENCES "Term" ("letter", "year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Section_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualifiedFor" (
    "staffId" TEXT NOT NULL,
    "termLetter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "courseCode" TEXT NOT NULL,

    PRIMARY KEY ("staffId", "termLetter", "year", "courseCode"),
    CONSTRAINT "QualifiedFor_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QualifiedFor_termLetter_year_fkey" FOREIGN KEY ("termLetter", "year") REFERENCES "Term" ("letter", "year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QualifiedFor_courseCode_termLetter_year_fkey" FOREIGN KEY ("courseCode", "termLetter", "year") REFERENCES "Section" ("courseCode", "termLetter", "year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QualifiedFor_staffId_termLetter_year_fkey" FOREIGN KEY ("staffId", "termLetter", "year") REFERENCES "StaffFormInput" ("staffId", "termLetter", "year") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreferenceFor" (
    "staffId" TEXT NOT NULL,
    "termLetter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "courseCode" TEXT NOT NULL,

    PRIMARY KEY ("staffId", "termLetter", "year", "courseCode"),
    CONSTRAINT "PreferenceFor_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PreferenceFor_termLetter_year_fkey" FOREIGN KEY ("termLetter", "year") REFERENCES "Term" ("letter", "year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PreferenceFor_courseCode_termLetter_year_fkey" FOREIGN KEY ("courseCode", "termLetter", "year") REFERENCES "Section" ("courseCode", "termLetter", "year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PreferenceFor_staffId_termLetter_year_fkey" FOREIGN KEY ("staffId", "termLetter", "year") REFERENCES "StaffFormInput" ("staffId", "termLetter", "year") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assignment" (
    "staffId" TEXT NOT NULL,
    "termLetter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "courseCode" TEXT NOT NULL,

    PRIMARY KEY ("staffId", "termLetter", "year", "courseCode"),
    CONSTRAINT "Assignment_termLetter_year_fkey" FOREIGN KEY ("termLetter", "year") REFERENCES "Term" ("letter", "year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_courseCode_termLetter_year_fkey" FOREIGN KEY ("courseCode", "termLetter", "year") REFERENCES "Section" ("courseCode", "termLetter", "year") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_email_key" ON "Professor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorFormInput_professorId_termLetter_year_key" ON "ProfessorFormInput"("professorId", "termLetter", "year");
