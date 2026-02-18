"use client";

import React, { useState } from "react";
import {
  BaseScheduleSelector,
  dateToSlot,
  isSlot,
  slotToDate,
  type Slot,
} from "@/lib/schedule-selector";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";

type SelectRequiredTimesProps = {
  timesRequired: Slot[];
  onChange: (slot: Slot[]) => void;
};

export const SelectRequiredTimes: React.FC<SelectRequiredTimesProps> = ({
  timesRequired,
  onChange,
}) => {
  const [enabled, setEnabled] = useState((timesRequired?.length ?? 0) > 0);

  return (
    <div>
      <Item className="px-0">
        <ItemContent>
          <ItemTitle>
            Do you need any in person help for this section?
          </ItemTitle>
          <ItemDescription>
            Please only request the times you absolutely need. Requesting a lot
            of slots may lead to poor assignments.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          No
          <Switch
            checked={enabled}
            onCheckedChange={(next) => {
              setEnabled(next);
              if (!next) onChange([]);
            }}
          />
          Yes
        </ItemActions>
      </Item>

      {enabled && (
        <div className="flex w-full flex-col items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <BaseScheduleSelector
              selection={timesRequired.map(slotToDate)}
              onChange={(dates) =>
                onChange(dates.map(dateToSlot).filter(isSlot))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};
