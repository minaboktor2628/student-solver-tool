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

import { CheckIcon, ChevronDownIcon, InfoIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import type { UserPreferenceStatus } from "@/server/api/routers/validator";
import { useMemo } from "react";
import { humanizeKey } from "@/lib/utils";

type ValidatorDisplayProps = { termId: string };

export function ValidatorDisplay({ termId }: ValidatorDisplayProps) {
  return (
    <div>
      <ValidatorStaffGotPreferences termId={termId} />
    </div>
  );
}

function ValidatorStaffGotPreferences(props: ValidatorDisplayProps) {
  const [{ userPrefRows, counts }] =
    api.validator.staffGotPreferences.useSuspenseQuery(props);

  const rowsByStatus = useMemo(() => {
    const grouped: Record<UserPreferenceStatus["status"], typeof userPrefRows> =
      {
        UNASSIGNED: [],
        ASSIGNED_NO_PREFS: [],
        ASSIGNED_NON_PREFERRED: [],
        GOT_PREFERENCE: [],
      } as const;

    for (const row of userPrefRows) {
      const status = row.result.status;
      if (grouped[status]) {
        grouped[status].push(row);
      }
    }

    return grouped;
  }, [userPrefRows]);

  const strongPreferenceCount = rowsByStatus.GOT_PREFERENCE.filter(
    (u) =>
      u.result.status === "GOT_PREFERENCE" &&
      u.result.level === "STRONGLY_PREFER",
  ).length;

  const preferenceCount = rowsByStatus.GOT_PREFERENCE.filter(
    (u) => u.result.status === "GOT_PREFERENCE" && u.result.level === "PREFER",
  ).length;

  return (
    <div className="flex flex-col space-y-4">
      <Collapsible>
        <Item variant="outline">
          <ItemMedia variant="icon">
            {counts.UNASSIGNED === 0 ? (
              <CheckIcon className="text-success" />
            ) : (
              <InfoIcon className="text-warning" />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Unassigned Staff</ItemTitle>
            <ItemDescription>Count: {counts.UNASSIGNED}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="group w-full">
                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </ItemActions>
          <CollapsibleContent className="rounded-md border">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPrefRows
                  .filter((u) => u.result.status === "UNASSIGNED")
                  .map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge className="text-xs">{u.roles.join(", ")}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Item>
      </Collapsible>

      <Collapsible>
        <Item variant="outline">
          <ItemMedia variant="icon">
            {counts.ASSIGNED_NO_PREFS === 0 ? (
              <CheckIcon className="text-success" />
            ) : (
              <InfoIcon className="text-warning" />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Assigned staff w/o preferences</ItemTitle>
            <ItemDescription>Count: {counts.ASSIGNED_NO_PREFS}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="group w-full">
                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </ItemActions>
          <CollapsibleContent className="overflow-scroll rounded-md border">
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
                {rowsByStatus.ASSIGNED_NO_PREFS.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      {u.result.status === "ASSIGNED_NO_PREFS" &&
                        `${u.result.assignment.courseCode}-${u.result.assignment.courseSection}`}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge className="text-xs">{u.roles.join(", ")}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Item>
      </Collapsible>

      <Collapsible>
        <Item variant="outline">
          <ItemMedia variant="icon">
            {counts.ASSIGNED_NO_PREFS === 0 ? (
              <CheckIcon className="text-success" />
            ) : (
              <InfoIcon className="text-warning" />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              Assigned staff that didn&apos;t get their preferences
            </ItemTitle>
            <ItemDescription>
              Count: {counts.ASSIGNED_NON_PREFERRED}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="group w-full">
                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </ItemActions>
          <CollapsibleContent className="overflow-scroll rounded-md border">
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
                {rowsByStatus.ASSIGNED_NON_PREFERRED.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      {u.result.status === "ASSIGNED_NON_PREFERRED" &&
                        `${u.result.assignment.courseCode}-${u.result.assignment.courseSection}`}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge className="text-xs">{u.roles.join(", ")}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Item>
      </Collapsible>

      <Collapsible>
        <Item variant="outline">
          <ItemMedia variant="icon">
            {counts.ASSIGNED_NO_PREFS === 0 ? (
              <InfoIcon className="text-warning" />
            ) : (
              <CheckIcon className="text-success" />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Assigned staff that got their preferences</ItemTitle>
            <ItemDescription className="flex flex-col">
              <p>Count: {counts.GOT_PREFERENCE}</p>
              <p>Strong preference: {strongPreferenceCount}</p>
              <p>Preference: {preferenceCount}</p>
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="group w-full">
                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </ItemActions>
          <CollapsibleContent className="overflow-scroll rounded-md border">
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
                {rowsByStatus.GOT_PREFERENCE.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      {u.result.status === "GOT_PREFERENCE" &&
                        `${u.result.assignment.courseCode}-${u.result.assignment.courseSection}`}
                    </TableCell>
                    <TableCell>
                      {u.result.status === "GOT_PREFERENCE" && (
                        <Badge variant="outline">
                          {humanizeKey(u.result.level)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge className="text-xs">{u.roles.join(", ")}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Item>
      </Collapsible>
    </div>
  );
}
