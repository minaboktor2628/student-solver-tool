"use client";
import React from "react";
import { DeadlineCard } from "@/components/professor/professor-dashboard/professor-deadline-card";
import { CoursesCard } from "@/components/professor/professor-dashboard/courses-card";
import { api } from "@/trpc/react";
import { Header } from "./professor-dashboard-header";
import ProfessorAssignmentsCard from "./professor-assignments-card";

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

  const [{ canEdit }] = api.professorForm.getCanEdit.useSuspenseQuery({
    userId: professorId,
  });

  const [{ info }] = api.professorDashboard.getDashBoardInfo.useSuspenseQuery({
    professorId,
    termId,
  });

  const [{ sections: assignedSections }] =
    api.professorDashboard.getProfessorAssignments.useSuspenseQuery({
      professorId,
      termId,
    });

  const username = info.professor;
  const deadlineDate = info.term.termProfDueDate;
  if (!deadlineDate) throw new Error("Deadline Date Invalid");
  const isSubmitted = sections.some((section) => section.professorPreference);
  const isPublished = info.term.isPublished;

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Header username={username} />
      {isPublished ? (
        /* is published */
        <ProfessorAssignmentsCard
          sections={assignedSections}
          termLetter={info.term.termLetter}
          termYear={info.term.termYear}
        />
      ) : canEdit?.canEditForm ? (
        /* can edit */
        <div>
          <DeadlineCard deadlineDate={deadlineDate} isSubmitted={isSubmitted} />
          <CoursesCard sections={sections} isSubmitted={isSubmitted} />
        </div>
      ) : (
        /* can't edit */
        <p>Preferences are being processed, check back soon!</p>
      )}
    </div>
  );
}

export default ProfessorHomePage;
