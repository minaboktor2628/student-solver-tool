"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import {
  BaseScheduleSelector,
  dayLetterFromDate,
  dateToSlot,
} from "@/lib/schedule-selector";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const utils = api.useUtils();
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation({
    onError: (error) => {
      console.error("Failed to save form:", error);
    },
    onSuccess: () => {
      toast.success("Form saved successfully");
      void utils.studentDashboard.invalidate();
      onNext();
    },
  });

  async function handleNextClick() {
    const weekly = selectionToWeekly(selection);

    saveFormMutation.mutate({
      userId,
      termId,
      weeklyAvailability: weekly,
    });
  }

  function selectionToWeekly(sel: Date[]): WeeklySlot[] {
    const set = new Map<string, WeeklySlot>();
    sel.forEach((d) => {
      const slot = dateToSlot(d);
      if (!slot) return;
      const key = `${slot.day}:${slot.hour}`;
      if (!set.has(key)) set.set(key, slot);
    });
    return Array.from(set.values());
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h2 className="mb-4 text-xl font-semibold">
        Select the times you are available for in-person, on campus work this
        term
      </h2>

      <div className="border-secondary rounded-lg border p-4 shadow-sm">
        <BaseScheduleSelector
          selection={selection}
          onChange={(newSelection: Date[]) => setSelection(newSelection)}
        />
      </div>

      <div className="mt-4 flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={saveFormMutation.isPending}
        >
          Back
        </Button>
        <Button onClick={handleNextClick} disabled={saveFormMutation.isPending}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default FormEntryTimes;
