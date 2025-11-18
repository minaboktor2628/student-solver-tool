/*
  Warnings:

  - You are about to drop the `Assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PreferenceFor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Professor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProfessorFormInput` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QualifiedFor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffFormInput` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `ProfessorPreference` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `antiPreference` on the `ProfessorPreference` table. All the data in the column will be lost.
  - You are about to drop the column `professorId` on the `ProfessorPreference` table. All the data in the column will be lost.
  - You are about to drop the column `staffId` on the `ProfessorPreference` table. All the data in the column will be lost.
  - You are about to drop the column `termLetter` on the `ProfessorPreference` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `ProfessorPreference` table. All the data in the column will be lost.
  - The primary key for the `Section` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `termLetter` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Section` table. All the data in the column will be lost.
  - The primary key for the `Term` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `endDate` on the `Term` table. All the data in the column will be lost.
  - You are about to drop the column `letter` on the `Term` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Term` table. All the data in the column will be lost.
  - You are about to drop the column `professorEmail` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `staffEmail` on the `User` table. All the data in the column will be lost.
  - Added the required column `termId` to the `AllowedEmail` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `ProfessorPreference` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `sectionId` to the `ProfessorPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProfessorPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicLevel` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseTitle` to the `Section` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Section` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `termId` to the `Section` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Term` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `termLetter` to the `Term` table without a default value. This is not possible if the table is not empty.
  - Added the required column `termProfessorDueDate` to the `Term` table without a default value. This is not possible if the table is not empty.
  - Added the required column `termStaffDueDate` to the `Term` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Professor_email_key";

-- DropIndex
DROP INDEX "ProfessorFormInput_professorId_termLetter_year_key";

-- DropIndex
DROP INDEX "Staff_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Assignment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PreferenceFor";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Professor";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProfessorFormInput";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QualifiedFor";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Staff";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StaffFormInput";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "StaffPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "timesAvailable" TEXT NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT true,
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
    "rank" INTEGER NOT NULL,
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
    CONSTRAINT "SectionAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SectionAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AllowedEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    CONSTRAINT "AllowedEmail_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AllowedEmail" ("email", "id", "role") SELECT "email", "id", "role" FROM "AllowedEmail";
DROP TABLE "AllowedEmail";
ALTER TABLE "new_AllowedEmail" RENAME TO "AllowedEmail";
CREATE INDEX "AllowedEmail_email_idx" ON "AllowedEmail"("email");
CREATE UNIQUE INDEX "AllowedEmail_email_role_termId_key" ON "AllowedEmail"("email", "role", "termId");
CREATE TABLE "new_ProfessorPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT true,
    "timesRequired" TEXT,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfessorPreference_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE "ProfessorPreference";
ALTER TABLE "new_ProfessorPreference" RENAME TO "ProfessorPreference";
CREATE UNIQUE INDEX "ProfessorPreference_sectionId_key" ON "ProfessorPreference"("sectionId");
CREATE TABLE "new_Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "termId" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "enrollment" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "requiredHours" INTEGER NOT NULL,
    "academicLevel" TEXT NOT NULL,
    CONSTRAINT "Section_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Section_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Section" ("capacity", "courseCode", "description", "enrollment", "professorId", "requiredHours") SELECT "capacity", "courseCode", "description", "enrollment", "professorId", "requiredHours" FROM "Section";
DROP TABLE "Section";
ALTER TABLE "new_Section" RENAME TO "Section";
CREATE TABLE "new_Term" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "termLetter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "termStaffDueDate" DATETIME NOT NULL,
    "termProfessorDueDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Term" ("year") SELECT "year" FROM "Term";
DROP TABLE "Term";
ALTER TABLE "new_Term" RENAME TO "Term";
CREATE UNIQUE INDEX "Term_termLetter_year_key" ON "Term"("termLetter", "year");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "hours" INTEGER
);
INSERT INTO "new_User" ("email", "emailVerified", "id", "image", "name") SELECT "email", "emailVerified", "id", "image", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StaffPreference_userId_termId_key" ON "StaffPreference"("userId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPreferencePreferredSection_staffPreferenceId_rank_key" ON "StaffPreferencePreferredSection"("staffPreferenceId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "SectionAssignment_sectionId_staffId_key" ON "SectionAssignment"("sectionId", "staffId");
