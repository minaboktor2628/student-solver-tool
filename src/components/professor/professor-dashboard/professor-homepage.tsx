"use client";
import React from "react";
import { DeadlineCard } from "@/components/professor/professor-dashboard/deadline-card";
import { CoursesCard } from "@/components/professor/professor-dashboard/courses-card";
import { Header } from "@/components/professor/professor-dashboard/header";
import { api } from "@/trpc/react";

interface ProfessorHomePageProps {
  professorId: string;
  termId: string;
}

function ProfessorHomePage({ professorId, termId }: ProfessorHomePageProps) {
  const [{ sections }] =
    api.professorForm.getProfessorSectionsForTerm.useSuspenseQuery({
      professorId,
      termId,
    });

  const [{ info }] = api.professorDashboard.getDashBoardInfo.useSuspenseQuery({
    professorId,
    termId,
  });

  const username = info.professor;
  const deadlineDate = info.term.termProfDueDate;
  if (!deadlineDate) throw new Error("Deadline Date Invalid");
  const isSubmitted = sections.some((section) => section.professorPreference);

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Header username={username} />
      <DeadlineCard deadlineDate={deadlineDate} isSubmitted={isSubmitted} />
      {/* Courses Overview */}
      <CoursesCard sections={sections} isSubmitted={isSubmitted} />
    </div>
  );
}

export default ProfessorHomePage;
