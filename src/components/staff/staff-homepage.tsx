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

  const [{ term }] = api.studentDashboard.getTermInfo.useSuspenseQuery({
    termId: activeTerm.id,
  });

  const username = info.name;
  const deadlineDate = info.term.dueDate;
  if (!deadlineDate) throw new Error("Deadline Date Invalid");

  // component display logic:

  // is published?
  //   has assignment?
  //     assignment card
  //   no assignment?
  //     "no assigment"
  // not published?
  //   can edit?
  //     edit form card
  //     has submitted?
  //       form summary
  //   cant edit?
  //     "wait for assignment"
  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Header username={username} />
      {term.isPublished ? (
        /* is published */

        /* has assignment */
        !!currentAssignment?.assignment ? (
          <StaffAssignment
            termLetter={activeTerm.termLetter}
            year={activeTerm.year}
            courseTitle={currentAssignment.assignment.section.courseTitle}
            courseCode={currentAssignment.assignment.section.courseCode}
            courseSection={currentAssignment.assignment.section.courseSection}
            meetingPattern={currentAssignment.assignment.section.meetingPattern}
            professorName={currentAssignment.assignment.section.professor.name}
            professorEmail={
              currentAssignment.assignment.section.professor.email
            }
          />
        ) : (
          /* no assignment */
          <p>
            You were not assigned a course this term ({term.termLetter}{" "}
            {term.year}). Please contact the coordinator if you have any
            questions.
          </p>
        )
      ) : /* not published */
      canEdit?.canEditForm ? (
        /* can edit */
        <div>
          <DeadlineCard
            deadlineDate={deadlineDate}
            isSubmitted={hasSubmitted}
          />
          <StaffDashboardFormSumary userId={userId} termId={activeTerm.id} />
        </div>
      ) : (
        /* can't edit */
        <p>
          Assigning currently in progress, check back soon for your assignment!
        </p>
      )}
    </div>
  );
};

export default StaffHomePage;
