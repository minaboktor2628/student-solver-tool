"use client";
import React from "react";
import { DeadlineCard } from "@/components/staff/staff-deadline-card";
import { useTerm } from "@/components/term-combobox";
import { Header } from "@/components/staff/staff-dashboard-header";
import { api } from "@/trpc/react";

interface StaffHomePageProps {
  userId: string;
}
const StaffHomePage: React.FC<StaffHomePageProps> = ({ userId }) => {
  const { active: activeTerm } = useTerm();
  if (!activeTerm) throw new Error("Term is invalid.");

  const pastAssignmentSections =
    api.studentDashboard.getPastAssignments.useSuspenseQuery({
      userId: userId,
      termId: activeTerm.id,
    });

  const currentAssignment =
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

  const username = info.name;
  const deadlineDate = info.term.dueDate;
  if (!deadlineDate) throw new Error("Deadline Date Invalid");

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Header username={username} />
      <DeadlineCard deadlineDate={deadlineDate} isSubmitted={hasSubmitted} />
      {/* Courses Overview */}
      {/* <CoursesCard sections={professorSections} isSubmitted={isSubmitted} /> */}
    </div>
  );
};

export default StaffHomePage;
