"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { SelectRequiredTimesProps, WeeklySlot } from "@/types/professor";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";

// Dynamic import with no SSR because the schedule selector depends on browser APIs
const ScheduleSelector = dynamic(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - dynamic import of a JS module without types
  () => import("react-schedule-selector").then((mod) => mod.default || mod),
  { ssr: false },
);

export const SelectRequiredTimes: React.FC<SelectRequiredTimesProps> = ({
  sectionId,
  timesRequired,
  initialSelection = [],
}) => {
  const [initialTimesRequired, setTimesRequired] =
    React.useState<WeeklySlot[]>(timesRequired);
  const [selection, setSelection] = React.useState<Date[]>(initialSelection);
  const [wantsSpecificTimes, setWantsSpecificTimes] = React.useState<boolean>(
    initialTimesRequired.length > 0,
  );

  function updateTimesRequired() {
    const selectedWeekly = DateToWeekly(selection);
    setTimesRequired(selectedWeekly);
  }

  function dayLetterFromDate(d: Date): WeeklySlot["day"] | null {
    switch (d.getDay()) {
      case 1:
        return "M";
      case 2:
        return "T";
      case 3:
        return "W";
      case 4:
        return "R";
      case 5:
        return "F";
      default:
        return null;
    }
  }

  function DateToWeekly(sel: Date[]): WeeklySlot[] {
    const set = new Map<string, WeeklySlot>();
    sel.forEach((d) => {
      const day = dayLetterFromDate(d);
      if (!day) return;
      const hour = d.getHours();
      const key = `${day}:${hour}`;
      if (!set.has(key)) set.set(key, { day, hour });
    });
    return Array.from(set.values()).sort((a, b) => {
      const order = { M: 0, T: 1, W: 2, R: 3, F: 4 } as Record<string, number>;
      return order[a.day]! - order[b.day]! || a.hour - b.hour;
    });
  }

  return (
    <div className="bg-white p-4 shadow-sm">
      <div>
        <Label className="mb-2 block text-base font-medium">
          Do you want to select times that you need assistants available?
        </Label>
        <p className="text-muted-foreground mb-2 text-sm">
          You may not receive your preference
        </p>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={wantsSpecificTimes === true ? "default" : "outline"}
            onClick={() => setWantsSpecificTimes(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={wantsSpecificTimes === false ? "default" : "outline"}
            onClick={() => {
              setWantsSpecificTimes(false);
              setTimesRequired([]);
            }}
          >
            No
          </Button>
        </div>
      </div>
      {wantsSpecificTimes && (
        <div>
          {/* ScheduleSelector props: selection is an array of Date objects */}
          <ScheduleSelector
            selection={selection}
            numDays={5}
            startDate={new Date(1970, 0, 5)}
            renderDateLabel={(d: Date) => {
              const letter = dayLetterFromDate(d) ?? "";
              return <div className="text-sm font-medium">{letter}</div>;
            }}
            minTime={8}
            maxTime={21}
            hourlyChunks={1}
            onChange={(newSelection: Date[]) => {
              setSelection(newSelection);
              updateTimesRequired();
            }}
          />
        </div>
      )}
    </div>
  );
};
