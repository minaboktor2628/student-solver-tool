-- DropIndex
DROP INDEX "StaffPreferencePreferredSection_staffPreferenceId_rank_key";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StaffPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "isAvailableForTerm" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT true,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffPreference_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StaffPreference" ("canEdit", "comments", "createdAt", "id", "isAvailableForTerm", "termId", "updatedAt", "userId") SELECT "canEdit", "comments", "createdAt", "id", "isAvailableForTerm", "termId", "updatedAt", "userId" FROM "StaffPreference";
DROP TABLE "StaffPreference";
ALTER TABLE "new_StaffPreference" RENAME TO "StaffPreference";
CREATE UNIQUE INDEX "StaffPreference_userId_termId_key" ON "StaffPreference"("userId", "termId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
