"use client";

import React from "react";
import type { TimesRequiredOutput, WeeklySlot } from "@/types/professor";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { BaseScheduleSelector } from "@/lib/schedule-selector";

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
  const [wantsSpecificTimes, setWantsSpecificTimes] = React.useState<boolean>(
    (timesRequired?.length ?? 0) > 0,
  );
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

  return (
    <div className="p-4 shadow-sm">
      <div>
        <Label className="block text-base font-medium">
          Do you want to select times that you need assistants available for
          labs and lectures?
        </Label>
        <p className="mb-2 font-bold">
          Do not include time slots for office hours.
        </p>
        <p className="text-muted-foreground mb-2 text-sm">
          You have a higher likelihood of receiving an assistant with your
          preference if you select fewer time slots.
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
              onChange(sectionId, []);
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
