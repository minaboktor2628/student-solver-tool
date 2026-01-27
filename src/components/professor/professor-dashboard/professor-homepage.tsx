"use client";
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { DeadlineCard } from "@/components/professor/professor-dashboard/deadline-card";
import { NumCoursesCard } from "@/components/professor/professor-dashboard/num-courses-card";
import { CoursesCard } from "@/components/professor/professor-dashboard/courses-card";
import { useTerm } from "@/components/term-combobox";
import { Header } from "@/components/professor/professor-dashboard/header";
import { api } from "@/trpc/react";

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

export type Section = {
  sectionId: string;
  courseCode: string;
  courseSection: string;
  courseTitle: string;
  professorPreference: {
    preferredStaff: any;
    avoidedStaff: any;
    timesRequired: any;
    comments: any;
  };
};

const ProfessorHomePage: React.FC<ProfessorHomePageProps> = ({ userId }) => {
  const { data } = api.professorForm.getProfessorSectionsForTerm.useQuery({
    professorId: userId,
  });
  const { data: professorData } =
    api.professorDashboard.getDashBoardInfo.useQuery({
      professorId: userId,
      termId: useTerm()?.active?.id ?? "",
    });
  const [sections, setSections] = useState<Record<string, Section>>();
  const username = professorData?.info?.professor;
  const deadlineDate = professorData?.info?.term?.termProfDueDate;
  const isSubmitted = false;
  const [numCourses, setNumCourses] = useState<number>();

  useEffect(() => {
    if (data) {
      const initialValues: Record<string, Section> = {};
      data?.sections.forEach((s) => {
        initialValues[s.sectionId] = {
          sectionId: s.sectionId,
          courseCode: s.courseCode,
          courseSection: s.courseSection,
          courseTitle: s.courseTitle,
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
      });
      setSections(initialValues);
      setNumCourses(Object.values(initialValues).length);
    }
  }, [data?.sections]);

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Header username={username} />
      <DeadlineCard
        deadlineDate={deadlineDate ?? new Date()}
        isSubmitted={isSubmitted}
      />
      <NumCoursesCard
        numberOfCourses={numCourses ?? 0}
        isSubmitted={isSubmitted}
      />
      {/* Courses Overview */}
      <CoursesCard sections={sections} />
    </div>
  );
};

export default ProfessorHomePage;
