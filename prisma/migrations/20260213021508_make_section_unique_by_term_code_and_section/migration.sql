/*
  Warnings:

  - A unique constraint covering the columns `[termId,courseCode,courseSection]` on the table `Section` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Section_termId_courseCode_courseSection_key" ON "Section"("termId", "courseCode", "courseSection");
