"use client";
import React, { useState } from "react";
import { DeadlineCard } from "@/components/professor/professor-dashboard/deadline-card";
import { CoursesCard } from "@/components/professor/professor-dashboard/courses-card";
import { useTerm } from "@/components/term-combobox";
import { Header } from "@/components/professor/professor-dashboard/header";
import { api } from "@/trpc/react";
import type { ProfessorSection } from "@/types/professor";

interface ProfessorHomePageProps {
  userId: string;
}
const ProfessorHomePage: React.FC<ProfessorHomePageProps> = ({ userId }) => {
  const { active: activeTerm } = useTerm();
  if (!activeTerm) throw new Error("Term is invalid.");

  const [{ sections }] =
    api.professorForm.getProfessorSectionsForTerm.useSuspenseQuery({
      professorId: userId,
      termId: activeTerm.id,
    });
  const professorSections = sections as ProfessorSection[];
  const [{ info }] = api.professorDashboard.getDashBoardInfo.useSuspenseQuery({
    professorId: userId,
    termId: activeTerm.id,
  });
  const username = info.professor;
  const deadlineDate = info.term.termProfDueDate;
  if (!deadlineDate) throw new Error("Deadline Date Invalid");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(true);

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Header username={username} />
      <DeadlineCard deadlineDate={deadlineDate} isSubmitted={isSubmitted} />
      {/* Courses Overview */}
      <CoursesCard sections={professorSections} isSubmitted={isSubmitted} />
    </div>
  );
};

export default ProfessorHomePage;
