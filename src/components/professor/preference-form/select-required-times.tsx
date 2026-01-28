"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { TimesRequiredOutput, WeeklySlot } from "@/types/professor";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import {
  calculateCoverage,
  dedupe,
  slotToDate,
  dateToSlot,
  stylesByStatus,
  BaseScheduleSelector,
} from "@/lib/schedule-selector";

type SelectRequiredTimesProps = {
  sectionId: string;
  timesRequired?: TimesRequiredOutput[];
  onChange: (sectionId: string, preferredStaff: TimesRequiredOutput[]) => void;
};

export const SelectRequiredTimes: React.FC<SelectRequiredTimesProps> = ({
  sectionId,
  timesRequired,
  onChange,
}) => {
  const [wantsSpecificTimes, setWantsSpecificTimes] = React.useState<boolean>();
  const calendarStart = new Date(1970, 0, 5);
  const dayMap: Record<WeeklySlot["day"], number> = {
    M: 0,
    T: 1,
    W: 2,
    R: 3,
    F: 4,
  };
  const reverseDayMap: Record<number, WeeklySlot["day"]> = {
    0: "M",
    1: "T",
    2: "W",
    3: "R",
    4: "F",
  };
  const [selection, setSelection] = React.useState<Date[]>(
    timesRequiredToDate(timesRequired ?? [], calendarStart),
  );

  const toggleTime = (dates: Date[]) => {
    setSelection(dates);
    const times = dateToTimesRequired(dates, calendarStart);
    onChange(sectionId, times);
  };

  function timesRequiredToDate(
    times: TimesRequiredOutput[],
    calendarStart: Date,
  ): Date[] {
    return times.map((time) => {
      const dayOffset = dayMap[time.day];

      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + dayOffset);
      date.setHours(time.hour, 0, 0, 0);

      return date;
    });
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

  function dateToTimesRequired(
    dates: Date[],
    calendarStart: Date,
  ): TimesRequiredOutput[] {
    return dates.map((date) => {
      const dayOffset = Math.floor(
        (date.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const day = reverseDayMap[dayOffset];

      if (!day) {
        throw new Error("Day not found");
      }

      return {
        day,
        hour: date.getHours(),
      };
    });
  }

  const renderDateCell = (time, _selected, setEl) => {
    const ref: React.Ref<HTMLDivElement> = (node) => {
      if (node) setEl(node);
    };

    const slot = dateToSlot(time);
    if (!slot) return <div ref={ref} className="h-4" />;
    return (
      <div
        ref={ref}
        role="gridcell"
        className={cn(
          "h-4 rounded-sm",
          "focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:outline-none",
          _selected
            ? "bg-primary/85 hover:bg-primary"
            : "bg-muted/40 hover:bg-muted/60",
        )}
      />
    );
  };

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
            }}
          >
            No
          </Button>
        </div>
      </div>
      {wantsSpecificTimes && (
        <div>
          <BaseScheduleSelector
            selection={selection}
            onChange={(newSelection: Date[]) => toggleTime(newSelection)}
          />
        </div>
      )}
    </div>
  );
};
