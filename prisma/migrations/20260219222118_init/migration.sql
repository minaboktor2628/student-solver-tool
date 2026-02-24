-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "termLetter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "termStaffDueDate" DATETIME NOT NULL,
    "termProfessorDueDate" DATETIME NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "StaffPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "isAvailableForTerm" BOOLEAN NOT NULL DEFAULT false,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffPreference_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffPreferenceQualifiedSection" (
    "staffPreferenceId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    PRIMARY KEY ("staffPreferenceId", "sectionId"),
    CONSTRAINT "StaffPreferenceQualifiedSection_staffPreferenceId_fkey" FOREIGN KEY ("staffPreferenceId") REFERENCES "StaffPreference" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffPreferenceQualifiedSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffPreferencePreferredSection" (
    "rank" TEXT NOT NULL,
    "staffPreferenceId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    PRIMARY KEY ("staffPreferenceId", "sectionId"),
    CONSTRAINT "StaffPreferencePreferredSection_staffPreferenceId_fkey" FOREIGN KEY ("staffPreferenceId") REFERENCES "StaffPreference" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffPreferencePreferredSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SectionAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SectionAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SectionAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "termId" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseSection" TEXT NOT NULL,
    "meetingPattern" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "professorId" TEXT,
    "enrollment" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "requiredHours" INTEGER NOT NULL,
    "academicLevel" TEXT NOT NULL,
    CONSTRAINT "Section_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Section_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessorPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfessorPreference_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessorPreferencePreferredStaff" (
    "professorPreferenceId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,

    PRIMARY KEY ("professorPreferenceId", "staffId"),
    CONSTRAINT "ProfessorPreferencePreferredStaff_professorPreferenceId_fkey" FOREIGN KEY ("professorPreferenceId") REFERENCES "ProfessorPreference" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessorPreferencePreferredStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessorPreferenceAvoidedStaff" (
    "professorPreferenceId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,

    PRIMARY KEY ("professorPreferenceId", "staffId"),
    CONSTRAINT "ProfessorPreferenceAvoidedStaff_professorPreferenceId_fkey" FOREIGN KEY ("professorPreferenceId") REFERENCES "ProfessorPreference" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessorPreferenceAvoidedStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffAvailableHour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hour" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "staffPreferenceId" TEXT,
    CONSTRAINT "StaffAvailableHour_staffPreferenceId_fkey" FOREIGN KEY ("staffPreferenceId") REFERENCES "StaffPreference" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SectionNeededHour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hour" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "professorPreferenceId" TEXT,
    CONSTRAINT "SectionNeededHour_professorPreferenceId_fkey" FOREIGN KEY ("professorPreferenceId") REFERENCES "ProfessorPreference" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "canEditForm" BOOLEAN NOT NULL DEFAULT true,
    "hours" INTEGER
);

-- CreateTable
CREATE TABLE "UserRole" (
    "role" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "role"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_TermToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TermToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TermToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Term_termLetter_year_key" ON "Term"("termLetter", "year");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPreference_userId_termId_key" ON "StaffPreference"("userId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionAssignment_sectionId_staffId_key" ON "SectionAssignment"("sectionId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_termId_courseCode_courseSection_key" ON "Section"("termId", "courseCode", "courseSection");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorPreference_sectionId_key" ON "ProfessorPreference"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "_TermToUser_AB_unique" ON "_TermToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_TermToUser_B_index" ON "_TermToUser"("B");
