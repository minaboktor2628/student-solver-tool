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
import { CheckIcon, InfoIcon } from "lucide-react";

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

  return (
    <div className="flex flex-col space-y-2">
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
      </Item>
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
      </Item>
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
      </Item>
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
            <p>
              Strong preference:{" "}
              {
                userPrefRows.filter(
                  (u) =>
                    u.result.status === "GOT_PREFERENCE" &&
                    u.result.level === "STRONGLY_PREFER",
                ).length
              }
            </p>
            <p>
              Preference:{" "}
              {
                userPrefRows.filter(
                  (u) =>
                    u.result.status === "GOT_PREFERENCE" &&
                    u.result.level === "PREFER",
                ).length
              }
            </p>
          </ItemDescription>
        </ItemContent>
      </Item>
    </div>
  );
}
