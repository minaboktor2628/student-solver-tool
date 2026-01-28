"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { BaseScheduleSelector } from "@/lib/schedule-selector";
import { Button } from "../ui/button";

export type WeeklySlot = { day: "M" | "T" | "W" | "R" | "F"; hour: number };

interface FormEntryTimesProps {
  userId: string;
  termId: string;
  onNext: () => void;
  onBack: () => void;
  initialSelection?: Date[];
}

const FormEntryTimes: React.FC<FormEntryTimesProps> = ({
  userId,
  termId,
  onNext,
  onBack,
  initialSelection = [],
}) => {
  const [selection, setSelection] = useState<Date[]>(initialSelection);
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation({
    onError: (error) => {
      console.error("Failed to save form:", error);
    },
  });

  async function handleNextClick() {
    const weekly = selectionToWeekly(selection);

    saveFormMutation.mutate({
      userId,
      termId,
      weeklyAvailability: weekly,
    });
    onNext();
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

      <div className="border-secondary rounded-lg border p-4 shadow-sm">
        <BaseScheduleSelector
          selection={selection}
          onChange={(newSelection: Date[]) => setSelection(newSelection)}
        />
      </div>

      <div className="mt-4 flex gap-3">
        <Button onClick={handleNextClick} disabled={saveFormMutation.isPending}>
          Next
        </Button>
        <Button
          onClick={onBack}
          variant="outline"
          disabled={saveFormMutation.isPending}
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default FormEntryTimes;
