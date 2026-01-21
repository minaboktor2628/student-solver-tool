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
import { DeadlineCard } from "@/components/professor/professor-dashboard/deadline-card";
import { NumCoursesCard } from "@/components/professor/professor-dashboard/num-courses-card";
import { CoursesCard } from "@/components/professor/professor-dashboard/courses-card";

/*Data I need to fetch from queries
From signed in User get name
From term get professor due date
From professors sections get professorPreference if any are null then set isSubmitted to false else true
From professors sections get courseTitle and courseCode
Query sections to see how many sections the professor is teaching

*/

export default async function ProfessorHomePage() {
  const mockUserName = "Professor Smith";
  const deadlineDate = new Date("2026-3-15");
  const isSubmitted = false;
  const numberOfCourses = 3;
  const courses = [
    {
      code: "CS101",
      name: "Introduction to Computer Science",
      section: "CL02",
    },
    { code: "CS201", name: "Data Structures", section: "CL03" },
    { code: "CS301", name: "Algorithms", section: "CL04" },
  ];

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Professor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {mockUserName}
        </p>
      </div>
      <DeadlineCard deadlineDate={deadlineDate} isSubmitted={isSubmitted} />
      <NumCoursesCard
        numberOfCourses={numberOfCourses}
        isSubmitted={isSubmitted}
      />
      {/* Courses Overview */}
      <CoursesCard courses={courses} />
    </div>
  );
}
