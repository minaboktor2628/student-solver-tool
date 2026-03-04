"use client";

import { api } from "@/trpc/react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { BanIcon, CheckIcon, ChevronDownIcon, InfoIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { type ReactNode } from "react";
import { humanizeKey } from "@/lib/utils";
import type { IllegalAssignment } from "@/server/api/routers/validator";

type ValidatorDisplayProps = { termId: string };

export function ValidatorDisplay({ termId }: ValidatorDisplayProps) {
  return (
    <div className="flex flex-col space-y-4">
      <ValidatorIllegalAssignment termId={termId} />
      <ValidatorStaffGotPreferences termId={termId} />
    </div>
  );
}

function ValidatorDisplayItem({
  status,
  title,
  description,
  children,
}: {
  status: "WARNING" | "OK" | "ERROR";
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
}) {
  const iconByStatus: Record<typeof status, ReactNode> = {
    OK: <CheckIcon className="text-success" />,
    WARNING: <InfoIcon className="text-warning" />,
    ERROR: <BanIcon className="text-destructive" />,
  } as const;

  return (
    <Collapsible>
      <Item variant="outline">
        <ItemMedia variant="icon">{iconByStatus[status]}</ItemMedia>
        <ItemContent>
          <ItemTitle>{title}</ItemTitle>
          <ItemDescription>{description}</ItemDescription>
        </ItemContent>
        {children && (
          <>
            <ItemActions>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-full">
                  <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
            </ItemActions>
            <CollapsibleContent className="flex w-full flex-col items-center justify-center overflow-scroll">
              {children}
            </CollapsibleContent>
          </>
        )}
      </Item>
    </Collapsible>
  );
}

function AssignmentTable({
  assignments,
}: {
  assignments: IllegalAssignment[];
}) {
  return (
    <div className="w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map(({ user, assignment }) => (
            <TableRow key={user.userId}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>
                {assignment.courseCode}-{assignment.courseSection}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge className="text-xs">{user.roles.join(", ")}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {assignments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-12 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ValidatorIllegalAssignment({ termId }: ValidatorDisplayProps) {
  const [
    { notAvailableForTerm, notQualifiedForSection, professorAvoidedStaff },
  ] = api.validator.illegalAssignment.useSuspenseQuery({
    termId,
  });

  return (
    <>
      <ValidatorDisplayItem
        status={notAvailableForTerm.length === 0 ? "OK" : "ERROR"}
        title="Assignments where assistant is not available for the term"
        description={`Count: ${notAvailableForTerm.length}`}
      >
        <AssignmentTable assignments={notAvailableForTerm} />
      </ValidatorDisplayItem>
      <ValidatorDisplayItem
        status={notQualifiedForSection.length === 0 ? "OK" : "ERROR"}
        title="Assignments where assistant is unqualified"
        description={`Count: ${notQualifiedForSection.length}`}
      >
        <AssignmentTable assignments={notQualifiedForSection} />
      </ValidatorDisplayItem>
      <ValidatorDisplayItem
        status={professorAvoidedStaff.length === 0 ? "OK" : "ERROR"}
        title="Assignments where assistnat is an anti-preference of the teaching professor"
        description={`Count: ${professorAvoidedStaff.length}`}
      >
        <AssignmentTable assignments={professorAvoidedStaff} />
      </ValidatorDisplayItem>
    </>
  );
}

function ValidatorStaffGotPreferences({ termId }: ValidatorDisplayProps) {
  const [
    {
      grouped: {
        gotPreference,
        unassigned,
        assignedButDidntGetPreferences,
        assignedButNoPreferencesSubmitted,
      },
    },
  ] = api.validator.staffAssignmentPreferences.useSuspenseQuery({
    termId,
  });

  const strongPreferenceCount = gotPreference.filter(
    (u) => u.level === "STRONGLY_PREFER",
  ).length;

  const preferenceCount = gotPreference.filter(
    (u) => u.level === "PREFER",
  ).length;

  return (
    <>
      <ValidatorDisplayItem
        status={unassigned.length === 0 ? "OK" : "WARNING"}
        title="Unassigned Staff"
        description={`Count: ${unassigned.length}`}
      >
        <AssignmentTable
          assignments={unassigned.map((row) => ({
            user: row.user,
            assignment: {
              courseCode: "n/a",
              sectionId: "n/a",
              courseSection: "n/a",
              courseTitle: "n/a",
            },
          }))}
        />
      </ValidatorDisplayItem>

      <ValidatorDisplayItem
        status={
          assignedButNoPreferencesSubmitted.length === 0 ? "OK" : "WARNING"
        }
        title="Assigned staff w/o preferences"
        description={`Count: ${assignedButNoPreferencesSubmitted.length}`}
      >
        <AssignmentTable assignments={assignedButNoPreferencesSubmitted} />
      </ValidatorDisplayItem>

      <ValidatorDisplayItem
        status={assignedButDidntGetPreferences.length === 0 ? "OK" : "WARNING"}
        title="Assigned staff that didn't get their preferences"
        description={`Count: ${assignedButDidntGetPreferences.length}`}
      >
        <AssignmentTable assignments={assignedButDidntGetPreferences} />
      </ValidatorDisplayItem>

      <ValidatorDisplayItem
        status={gotPreference.length === 0 ? "ERROR" : "OK"}
        title="Assigned staff that got their preferences"
        description={
          <span className="flex flex-col">
            <span>Count: {gotPreference.length}</span>
            <span>Strong preference: {strongPreferenceCount}</span>
            <span>Preference: {preferenceCount}</span>
          </span>
        }
      >
        <div className="w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Preference</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gotPreference.map(({ user, assignment, level }) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    {assignment.courseCode}-{assignment.courseSection}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{humanizeKey(level)}</Badge>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className="text-xs">{user.roles.join(", ")}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ValidatorDisplayItem>
    </>
  );
}
