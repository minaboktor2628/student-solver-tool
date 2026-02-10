-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Section" (
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
INSERT INTO "new_Section" ("academicLevel", "capacity", "courseCode", "courseSection", "courseTitle", "description", "enrollment", "id", "meetingPattern", "professorId", "requiredHours", "termId") SELECT "academicLevel", "capacity", "courseCode", "courseSection", "courseTitle", "description", "enrollment", "id", "meetingPattern", "professorId", "requiredHours", "termId" FROM "Section";
DROP TABLE "Section";
ALTER TABLE "new_Section" RENAME TO "Section";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
