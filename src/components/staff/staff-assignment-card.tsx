"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { BookOpen, Clock, GraduationCap, Mail } from "lucide-react";

interface StaffAssignmentProps {
  termLetter: string;
  year: number;
  courseTitle: string;
  courseCode: string;
  courseSection: string;
  meetingPattern: string;
  professorName: string | null;
  professorEmail: string | null;
}
const StaffAssignment: React.FC<StaffAssignmentProps> = ({
  termLetter,
  year,
  courseTitle,
  courseCode,
  courseSection,
  meetingPattern,
  professorName,
  professorEmail,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {termLetter}
          {year} Assignment
        </CardTitle>
        <CardDescription>
          {courseCode}-{courseSection}: {courseTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Clock className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Meeting Pattern
              </p>
              <p className="text-sm">{meetingPattern}</p>
            </div>
          </div>

          {professorName && (
            <div className="flex items-start gap-2">
              <GraduationCap className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Professor
                </p>
                <p className="text-sm">{professorName}</p>
              </div>
            </div>
          )}

          {professorEmail && (
            <div className="flex items-start gap-2">
              <Mail className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Email
                </p>
                <a
                  href={`mailto:${professorEmail}`}
                  className="text-primary text-sm hover:underline"
                >
                  {professorEmail}
                </a>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffAssignment;
