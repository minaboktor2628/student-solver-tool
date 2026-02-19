-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Term" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "termLetter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "termStaffDueDate" DATETIME NOT NULL,
    "termProfessorDueDate" DATETIME NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Term" ("active", "createdAt", "id", "termLetter", "termProfessorDueDate", "termStaffDueDate", "year") SELECT "active", "createdAt", "id", "termLetter", "termProfessorDueDate", "termStaffDueDate", "year" FROM "Term";
DROP TABLE "Term";
ALTER TABLE "new_Term" RENAME TO "Term";
CREATE UNIQUE INDEX "Term_termLetter_year_key" ON "Term"("termLetter", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
