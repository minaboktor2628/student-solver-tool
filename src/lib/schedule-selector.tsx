/* When2meet component lib helpers.
 * there is an export here for a base component to use. use this instead
 * of the one that the lib provides, as this one is styled to match
 * the rest of the app. */
import type { Day } from "@/types/global";

import ScheduleSelector from "react-schedule-selector";
import { cn } from "./utils";
import type { Slot } from "./schedule-coverage";
export type BaseScheduleSelectorProps = Partial<ScheduleSelector["props"]>;

export const START = new Date(1970, 0, 5);

export function slotToDate(slot: Slot) {
  const dayMap: Record<Day, number> = {
    M: 0,
    T: 1,
    W: 2,
    R: 3,
    F: 4,
  };

  // Clone and normalize to midnight
  const base = new Date(START);
  base.setHours(0, 0, 0, 0);

  // Compute the target day in that same week
  const d = new Date(base);
  d.setDate(base.getDate() + dayMap[slot.day]);

  // Support fractional hours: 9.5 -> 9:30
  const hours = Math.floor(slot.hour);
  const minutes = Math.round((slot.hour - hours) * 60);
  d.setHours(hours, minutes, 0, 0);

  return d;
}
export function dateToSlot(d: Date): Slot | null {
  const day = dayLetterFromDate(d);
  if (!day) return null; // outside Mon–Fri
  const hour = d.getHours() + d.getMinutes() / 60;
  return { day, hour };
}

export function dayLetterFromDate(d: Date): Day | null {
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

// Visual styles + titles for each state
export const stylesByStatus = {
  "not-needed": {
    cls: "bg-muted/40 hover:bg-muted/60",
    title: "Not needed",
  },
  "not-needed-assigned": {
    cls: "bg-amber-500/80 hover:bg-amber-500 text-amber-50",
    title: "Not needed - assigned",
  },
  "needed-assigned": {
    cls: "bg-green-600/85 hover:bg-green-600 text-green-50",
    title: "Needed - assigned",
  },
  "needed-unassigned": {
    cls: "bg-primary/85 hover:bg-primary text-red-50",
    title: "Needed - not assigned",
  },
} as const;

export function BaseScheduleSelector({
  selection = [],
  numDays = 5,
  minTime = 8,
  maxTime = 22,
  startDate = START,
  renderDateLabel = (d: Date) => (
    <div className="text-sm font-medium">{dayLetterFromDate(d)}</div>
  ),
  renderTimeLabel = (d: Date) => (
    <p className="line-clamp-1 text-sm font-medium">
      {d.toLocaleTimeString([], { hour: "numeric", hour12: true })}
    </p>
  ),
  renderDateCell = (time, _selected, setEl) => {
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
            : "bg-muted hover:bg-muted/60",
        )}
      />
    );
  },

  ...rest
}: BaseScheduleSelectorProps) {
  return (
    <ScheduleSelector
      selection={selection}
      numDays={numDays}
      minTime={minTime}
      maxTime={maxTime}
      startDate={startDate}
      renderDateLabel={renderDateLabel}
      renderTimeLabel={renderTimeLabel}
      renderDateCell={renderDateCell}
      {...rest}
    />
  );
}
