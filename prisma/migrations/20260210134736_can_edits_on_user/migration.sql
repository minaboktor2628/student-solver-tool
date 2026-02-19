/*
  Warnings:

  - You are about to drop the column `canEdit` on the `ProfessorPreference` table. All the data in the column will be lost.
  - You are about to drop the column `canEdit` on the `StaffPreference` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProfessorPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfessorPreference_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProfessorPreference" ("comments", "createdAt", "id", "sectionId", "updatedAt") SELECT "comments", "createdAt", "id", "sectionId", "updatedAt" FROM "ProfessorPreference";
DROP TABLE "ProfessorPreference";
ALTER TABLE "new_ProfessorPreference" RENAME TO "ProfessorPreference";
CREATE UNIQUE INDEX "ProfessorPreference_sectionId_key" ON "ProfessorPreference"("sectionId");
CREATE TABLE "new_StaffPreference" (
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
INSERT INTO "new_StaffPreference" ("comments", "createdAt", "id", "isAvailableForTerm", "termId", "updatedAt", "userId") SELECT "comments", "createdAt", "id", "isAvailableForTerm", "termId", "updatedAt", "userId" FROM "StaffPreference";
DROP TABLE "StaffPreference";
ALTER TABLE "new_StaffPreference" RENAME TO "StaffPreference";
CREATE UNIQUE INDEX "StaffPreference_userId_termId_key" ON "StaffPreference"("userId", "termId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "canEditForm" BOOLEAN NOT NULL DEFAULT true,
    "hours" INTEGER
);
INSERT INTO "new_User" ("email", "emailVerified", "hours", "id", "name") SELECT "email", "emailVerified", "hours", "id", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
