"use client";

// Ensure core-js polyfill required by some CJS packages is available at bundle time
import "core-js/modules/web.dom-collections.iterator";

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import with no SSR because the schedule selector depends on browser APIs
const ScheduleSelector: any = dynamic(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - dynamic import of a JS module without types
  () => import("react-schedule-selector").then((mod) => mod.default || mod),
  { ssr: false },
);

export type WeeklySlot = { day: "M" | "T" | "W" | "R" | "F"; hour: number };

interface FormEntryTimesProps {
  onNext: () => void;
  onExit: () => void;
  initialSelection?: Date[];
  /** optional callback to receive weekly availability as day/hour pairs */
  onSave?: (weekly: WeeklySlot[]) => void;
}

const FormEntryTimes: React.FC<FormEntryTimesProps> = ({
  onNext,
  onExit,
  initialSelection = [],
  onSave,
}) => {
  const [selection, setSelection] = useState<Date[]>(initialSelection);

  function dayLetterFromDate(d: Date): WeeklySlot["day"] | null {
    // getDay(): 1 = Mon, ..., 5 = Fri
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

  function selectionToWeekly(sel: Date[]): WeeklySlot[] {
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
    <div className="mx-auto max-w-3xl p-4">
      <h2 className="mb-4 text-xl font-semibold">
        Select the times you're available for this term
      </h2>

      <div className="bg-white p-4 shadow-sm">
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
          onChange={(newSelection: Date[]) => setSelection(newSelection)}
        />
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => {
            const weekly = selectionToWeekly(selection);
            onSave?.(weekly);
            onNext();
            console.log("Weekly availability:", weekly);
          }}
          className="bg-primary/70 hover:bg-primary/100 rounded-lg px-4 py-2 text-white"
        >
          Next
        </button>
        <button
          onClick={onExit}
          className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default FormEntryTimes;
