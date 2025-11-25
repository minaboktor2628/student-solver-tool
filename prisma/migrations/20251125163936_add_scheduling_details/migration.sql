/*
  Warnings:

  - You are about to drop the column `timesRequired` on the `ProfessorPreference` table. All the data in the column will be lost.
  - You are about to drop the column `timesAvailable` on the `StaffPreference` table. All the data in the column will be lost.
  - Added the required column `courseSection` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `meetingPattern` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProfessorPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT true,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfessorPreference_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProfessorPreference" ("canEdit", "comments", "createdAt", "id", "sectionId", "updatedAt") SELECT "canEdit", "comments", "createdAt", "id", "sectionId", "updatedAt" FROM "ProfessorPreference";
DROP TABLE "ProfessorPreference";
ALTER TABLE "new_ProfessorPreference" RENAME TO "ProfessorPreference";
CREATE UNIQUE INDEX "ProfessorPreference_sectionId_key" ON "ProfessorPreference"("sectionId");
CREATE TABLE "new_Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "termId" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseSection" TEXT NOT NULL,
    "meetingPattern" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "enrollment" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "requiredHours" INTEGER NOT NULL,
    "academicLevel" TEXT NOT NULL,
    CONSTRAINT "Section_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Section_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Section" ("academicLevel", "capacity", "courseCode", "courseTitle", "description", "enrollment", "id", "professorId", "requiredHours", "termId") SELECT "academicLevel", "capacity", "courseCode", "courseTitle", "description", "enrollment", "id", "professorId", "requiredHours", "termId" FROM "Section";
DROP TABLE "Section";
ALTER TABLE "new_Section" RENAME TO "Section";
CREATE TABLE "new_StaffPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT true,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffPreference_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StaffPreference" ("canEdit", "comments", "createdAt", "id", "termId", "updatedAt", "userId") SELECT "canEdit", "comments", "createdAt", "id", "termId", "updatedAt", "userId" FROM "StaffPreference";
DROP TABLE "StaffPreference";
ALTER TABLE "new_StaffPreference" RENAME TO "StaffPreference";
CREATE UNIQUE INDEX "StaffPreference_userId_termId_key" ON "StaffPreference"("userId", "termId");
CREATE TABLE "new_StaffPreferencePreferredSection" (
    "rank" TEXT NOT NULL,
    "staffPreferenceId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    PRIMARY KEY ("staffPreferenceId", "sectionId"),
    CONSTRAINT "StaffPreferencePreferredSection_staffPreferenceId_fkey" FOREIGN KEY ("staffPreferenceId") REFERENCES "StaffPreference" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffPreferencePreferredSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StaffPreferencePreferredSection" ("rank", "sectionId", "staffPreferenceId") SELECT "rank", "sectionId", "staffPreferenceId" FROM "StaffPreferencePreferredSection";
DROP TABLE "StaffPreferencePreferredSection";
ALTER TABLE "new_StaffPreferencePreferredSection" RENAME TO "StaffPreferencePreferredSection";
CREATE UNIQUE INDEX "StaffPreferencePreferredSection_staffPreferenceId_rank_key" ON "StaffPreferencePreferredSection"("staffPreferenceId", "rank");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
