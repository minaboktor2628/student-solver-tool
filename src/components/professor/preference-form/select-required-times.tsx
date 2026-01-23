"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { TimesRequiredOutput, WeeklySlot } from "@/types/professor";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { BaseScheduleSelector } from "@/lib/schedule-selector";

// Dynamic import with no SSR because the schedule selector depends on browser APIs
const ScheduleSelector = dynamic(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - dynamic import of a JS module without types
  () => import("react-schedule-selector").then((mod) => mod.default || mod),
  { ssr: false },
);

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
          {/* 
          <BaseScheduleSelector 
            selection={selection}
            numDays={5}
            minTime={8}
            maxTime={21}
            startDate={new Date(1970, 0, 5)}
            renderDateLabel={(d: Date) => {
              const letter = dayLetterFromDate(d) ?? "";
              return <div className="text-sm font-medium">{letter}</div>;
            }}
            /> */}
          {/* ScheduleSelector props: selection is an array of Date objects */}
          <ScheduleSelector
            selection={selection}
            numDays={5}
            startDate={calendarStart}
            renderDateLabel={(d: Date) => {
              const letter = dayLetterFromDate(d) ?? "";
              return <div className="text-sm font-medium">{letter}</div>;
            }}
            minTime={8}
            maxTime={21}
            hourlyChunks={1}
            onChange={(newSelection: Date[]) => toggleTime(newSelection)}
          />
        </div>
      )}
    </div>
  );
};
