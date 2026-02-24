"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail } from "lucide-react";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";
import type { TermLetter } from "@prisma/client";

type RouterOutputs = inferRouterOutputs<AppRouter>;

interface ProfessorAssignmentsCardProps {
  sections: RouterOutputs["professorDashboard"]["getProfessorAssignments"]["sections"];
  termLetter?: TermLetter;
  termYear?: number;
}

const ProfessorAssignmentsCard: React.FC<ProfessorAssignmentsCardProps> = ({
  sections,
  termLetter,
  termYear,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {termLetter} {termYear} Assignments
        </CardTitle>
        <CardDescription>
          Staff assigned to your courses for this term
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.sectionId} className="rounded-lg border p-4">
              <h3 className="font-semibold">
                {section.courseCode}-{section.courseSection} –{" "}
                {section.courseTitle}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {section.meetingPattern}
              </p>

              <h4 className="mt-3 font-medium">Assigned Staff</h4>
              {section.assignedStaff.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No staff assigned for this term.
                </p>
              ) : (
                <ul className="mt-1 space-y-2">
                  {section.assignedStaff.map((staff) => (
                    <li key={staff.id} className="ml-4">
                      <p className="text-sm font-medium">
                        {staff.name ?? "Unknown"}{" "}
                        <span className="text-muted-foreground font-normal">
                          ({staff.roles?.join(", ")})
                        </span>
                      </p>
                      {staff.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="text-muted-foreground h-3 w-3" />
                          <a
                            href={`mailto:${staff.email}`}
                            className="text-primary text-xs hover:underline"
                          >
                            {staff.email}
                          </a>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessorAssignmentsCard;
