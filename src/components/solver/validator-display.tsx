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

type ValidatorDisplayProps = { termId: string };

export function ValidatorDisplay({ termId }: ValidatorDisplayProps) {
  return (
    <div className="flex flex-col space-y-4">
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
            <CollapsibleContent className="overflow-scroll">
              {children}
            </CollapsibleContent>
          </>
        )}
      </Item>
    </Collapsible>
  );
}

function ValidatorStaffGotPreferences({ termId }: ValidatorDisplayProps) {
  const [{ grouped }] = api.validator.staffGotPreferences.useSuspenseQuery({
    termId,
  });

  const strongPreferenceCount = grouped.gotPreference.filter(
    (u) => u.level === "STRONGLY_PREFER",
  ).length;

  const preferenceCount = grouped.gotPreference.filter(
    (u) => u.level === "PREFER",
  ).length;

  return (
    <>
      <ValidatorDisplayItem
        status={grouped.unassigned.length === 0 ? "OK" : "WARNING"}
        title="Unassigned Staff"
        description={`Count: ${grouped.unassigned.length}`}
      >
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.unassigned.map(({ user }) => (
              <TableRow key={user.userId}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className="text-xs">{user.roles.join(", ")}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ValidatorDisplayItem>

      <ValidatorDisplayItem
        status={
          grouped.assignedButNoPreferencesSubmitted.length === 0
            ? "OK"
            : "WARNING"
        }
        title="Assigned staff w/o preferences"
        description={`Count: ${grouped.assignedButNoPreferencesSubmitted.length}`}
      >
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
            {grouped.assignedButNoPreferencesSubmitted.map(
              ({ user, assignment }) => (
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
              ),
            )}
          </TableBody>
        </Table>
      </ValidatorDisplayItem>

      <ValidatorDisplayItem
        status={
          grouped.assignedButDidntGetPreferences.length === 0 ? "OK" : "WARNING"
        }
        title="Assigned staff that didn't get their preferences"
        description={`Count: ${grouped.assignedButDidntGetPreferences.length}`}
      >
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
            {grouped.assignedButDidntGetPreferences.map(
              ({ user, assignment }) => (
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
              ),
            )}
          </TableBody>
        </Table>
      </ValidatorDisplayItem>

      <ValidatorDisplayItem
        status={grouped.gotPreference.length === 0 ? "ERROR" : "OK"}
        title="Assigned staff that got their preferences"
        description={
          <div className="flex flex-col">
            <p>Count: {grouped.gotPreference.length}</p>
            <p>Strong preference: {strongPreferenceCount}</p>
            <p>Preference: {preferenceCount}</p>
          </div>
        }
      >
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
            {grouped.gotPreference.map(({ user, assignment, level }) => (
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
      </ValidatorDisplayItem>
    </>
  );
}
