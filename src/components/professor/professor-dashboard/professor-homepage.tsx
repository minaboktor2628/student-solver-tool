"use client";
import React from "react";
import { DeadlineCard } from "@/components/professor/professor-dashboard/deadline-card";
import { CoursesCard } from "@/components/professor/professor-dashboard/courses-card";
import { useTerm, type Term } from "@/components/term-combobox";
import { Header } from "@/components/professor/professor-dashboard/header";
import { api } from "@/trpc/react";
import type { ProfessorSection } from "@/types/professor";

interface ProfessorHomePageProps {
  userId: string;
}

function ProfessorHomePage({ userId }: ProfessorHomePageProps) {
  const { active: activeTerm } = useTerm();

  if (!activeTerm) throw new Error("No active term. Please contact admin.");

  return <InternalPage userId={userId} activeTerm={activeTerm} />;
}

function InternalPage({
  userId,
  activeTerm,
}: ProfessorHomePageProps & { activeTerm: Term }) {
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
  const isSubmitted = sections.some((section) => {
    const pref = section.professorPreference;

    return !!(
      pref &&
      ((pref.preferredStaff && pref.preferredStaff.length > 0) ??
        (pref.avoidedStaff && pref.avoidedStaff.length > 0) ??
        (pref.timesRequired && pref.timesRequired.length > 0) ??
        (pref.comments && pref.comments.trim() !== ""))
    );
  });

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Header username={username} />
      <DeadlineCard deadlineDate={deadlineDate} isSubmitted={isSubmitted} />
      {/* Courses Overview */}
      <CoursesCard sections={professorSections} isSubmitted={isSubmitted} />
    </div>
  );
}

export default ProfessorHomePage;
