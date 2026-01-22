-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SectionAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SectionAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SectionAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SectionAssignment" ("id", "sectionId", "staffId") SELECT "id", "sectionId", "staffId" FROM "SectionAssignment";
DROP TABLE "SectionAssignment";
ALTER TABLE "new_SectionAssignment" RENAME TO "SectionAssignment";
CREATE UNIQUE INDEX "SectionAssignment_sectionId_staffId_key" ON "SectionAssignment"("sectionId", "staffId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
