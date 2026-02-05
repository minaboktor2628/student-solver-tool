/*
  Warnings:

  - You are about to drop the `AllowedTermUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AllowedTermUser";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_TermToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TermToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TermToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_TermToUser_AB_unique" ON "_TermToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_TermToUser_B_index" ON "_TermToUser"("B");
