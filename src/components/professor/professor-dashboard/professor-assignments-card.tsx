"use client";
import React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserIcon } from "lucide-react";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";
import type { TermLetter } from "@prisma/client";
import { CopyButton } from "@/components/copy-button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { BaseScheduleSelector, slotToDate } from "@/lib/schedule-selector";

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
      <CardContent className="space-y-4">
        {sections.length === 0 && <p>No sections!</p>}
        {sections.map((section) => (
          <Card key={section.sectionId}>
            <CardHeader>
              <CardTitle>
                {section.courseCode}-{section.courseSection} –{" "}
                {section.courseTitle}
              </CardTitle>
              <CardDescription>{section.meetingPattern}</CardDescription>
              <CardAction>
                <CopyButton
                  size="default"
                  variant="outline"
                  value={section.assignedStaff.map((s) => s.email).join(", ")}
                >
                  Copy all emails
                </CopyButton>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-1">
              {section.assignedStaff.length === 0 && (
                <p>No staff assigned for this term.</p>
              )}

              {section.assignedStaff.map((staff) => (
                <Item key={staff.id} variant="outline" size="sm">
                  <ItemMedia variant="icon">
                    <UserIcon />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      <span>{staff.name}</span>
                      <span className="text-muted-foreground font-normal">
                        ({staff.roles?.join(", ")})
                      </span>
                    </ItemTitle>
                    <ItemDescription>
                      <a href={`mailto:${staff.email}`}>{staff.email}</a>
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <CopyButton
                      value={staff.email ?? "No email."}
                      variant="outline"
                    />
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button size="sm">Availability</Button>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <BaseScheduleSelector
                          selection={staff.timesAvailable.map(slotToDate)}
                        />
                      </HoverCardContent>
                    </HoverCard>
                  </ItemActions>
                </Item>
              ))}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProfessorAssignmentsCard;
