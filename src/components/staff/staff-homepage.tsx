"use client";
import React from "react";
import { DeadlineCard } from "@/components/staff/staff-deadline-card";
import { useTerm } from "@/components/term-combobox";
import { Header } from "@/components/staff/staff-dashboard-header";
import { api } from "@/trpc/react";
import StaffDashboardFormSumary from "./staff-dashboard-form-summary";
import StaffAssignment from "./staff-assignment-card";

interface StaffHomePageProps {
  userId: string;
}
const StaffHomePage: React.FC<StaffHomePageProps> = ({ userId }) => {
  const { active: activeTerm } = useTerm();
  if (!activeTerm) throw new Error("Term is invalid.");

  const [currentAssignment] =
    api.studentDashboard.getCurrentAssignment.useSuspenseQuery({
      userId: userId,
      termId: activeTerm.id,
    });

  const [hasSubmitted] =
    api.studentDashboard.hasSubmittedPreferencesForm.useSuspenseQuery({
      userId: userId,
      termId: activeTerm.id,
    });

  const [{ info }] =
    api.studentDashboard.getStudentDashboardInfo.useSuspenseQuery({
      userId: userId,
      termId: activeTerm.id,
    });

  const [{ canEdit }] = api.studentForm.getCanEdit.useSuspenseQuery({
    userId: userId ?? "",
  });

  const username = info.name;
  const deadlineDate = info.term.dueDate;
  if (!deadlineDate) throw new Error("Deadline Date Invalid");

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Header username={username} />
      {canEdit?.canEditForm && (
        <div>
          <DeadlineCard
            deadlineDate={deadlineDate}
            isSubmitted={hasSubmitted}
          />
          <StaffDashboardFormSumary userId={userId} termId={activeTerm.id} />
        </div>
      )}
      {currentAssignment?.assignment && (
        <StaffAssignment
          termLetter={activeTerm.termLetter}
          year={activeTerm.year}
          courseTitle={currentAssignment.assignment.section.courseTitle}
          courseCode={currentAssignment.assignment.section.courseCode}
          courseSection={currentAssignment.assignment.section.courseSection}
          meetingPattern={currentAssignment.assignment.section.meetingPattern}
          professorName={currentAssignment.assignment.section.professor.name}
          professorEmail={currentAssignment.assignment.section.professor.email}
        />
      )}
      {!canEdit?.canEditForm && !currentAssignment?.assignment && (
        <h2>
          Assignments currently in progress, check back soon for your assignment
        </h2>
      )}
    </div>
  );
};

export default StaffHomePage;
