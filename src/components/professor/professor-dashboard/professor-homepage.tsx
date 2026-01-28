"use client";
import React, { useEffect, useState } from "react";
import { DeadlineCard } from "@/components/professor/professor-dashboard/deadline-card";
import { CoursesCard } from "@/components/professor/professor-dashboard/courses-card";
import { useTerm } from "@/components/term-combobox";
import { Header } from "@/components/professor/professor-dashboard/header";
import { api } from "@/trpc/react";
import type { SectionWithProfessorPreference } from "@/types/professor";

/*Data I need to fetch from queries
From signed in User get name
From term get professor due date
From professors sections get professorPreference if any are null then set isSubmitted to false else true
From professors sections get courseTitle and courseCode
Query sections to see how many sections the professor is teaching
*/
interface ProfessorHomePageProps {
  userId: string;
}

const ProfessorHomePage: React.FC<ProfessorHomePageProps> = ({ userId }) => {
  const { data } = api.professorForm.getProfessorSectionsForTerm.useQuery({
    professorId: userId,
  });
  const { data: professorData } =
    api.professorDashboard.getDashBoardInfo.useQuery({
      professorId: userId,
      termId: useTerm()?.active?.id ?? "",
    });
  const [sections, setSections] =
    useState<Record<string, SectionWithProfessorPreference>>();
  const username = professorData?.info?.professor;
  const deadlineDate = professorData?.info?.term?.termProfDueDate;
  const [isSubmitted, setIsSubmitted] = useState<boolean>(true);

  useEffect(() => {
    if (data?.sections) {
      const initialValues: Record<string, SectionWithProfessorPreference> = {};
      data?.sections.forEach((s) => {
        initialValues[s.sectionId] = {
          sectionId: s.sectionId,
          courseCode: s.courseCode,
          courseSection: s.courseSection,
          courseTitle: s.courseTitle,
          meetingPattern: s.meetingPattern,
          enrollment: s.enrollment,
          capacity: s.capacity,
          requiredHours: s.requiredHours,
          availableAssistants: s.availableAssistants.map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            hours: a.hours,
            roles: a.roles,
          })),
          professorPreference: {
            preferredStaff: s.professorPreference?.preferredStaff?.map((a) => ({
              id: a.id,
              name: a.name,
              email: a.email,
              hours: a.hours,
              roles: (a.roles ?? []).map((r) => ({ role: r })),
            })),
            avoidedStaff: s.professorPreference?.avoidedStaff?.map((a) => ({
              id: a.id,
              name: a.name,
              email: a.email,
              hours: a.hours,
              roles: (a.roles ?? []).map((r) => ({ role: r })),
            })),
            timesRequired: s.professorPreference?.timesRequired?.map((a) => ({
              day: a.day,
              hour: a.hour,
            })),
            comments: s.professorPreference?.comments,
          },
        };
        if (!s.professorPreference.preferredStaff) {
          setIsSubmitted(false);
        }
      });
      setSections(initialValues);
      console.log(data?.sections);
    }
  }, [data?.sections]);

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Header username={username} />
      <DeadlineCard
        deadlineDate={deadlineDate ?? new Date()}
        isSubmitted={isSubmitted}
      />
      {/* Courses Overview */}
      <CoursesCard sections={sections} isSubmitted={isSubmitted} />
    </div>
  );
};

export default ProfessorHomePage;
