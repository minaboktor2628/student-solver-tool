"use client";

import React from "react";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import type {
  SelectAssistantPreferenceProps,
  Assistant,
} from "@/types/professor";

export const SelectAssistantPref: React.FC<SelectAssistantPreferenceProps> = ({
  sectionId,
  availableAssistants,
  chosenAssistants,
}) => {
  const [wantsSpecificAssistants, setWantsSpecificAssistants] =
    React.useState<boolean>();
  const [selectedPreferences, setPreferences] = React.useState<Assistant[]>(
    chosenAssistants ?? [],
  );
  const handleAssistantChange = (assistant: Assistant, checked: boolean) => {
    setPreferences((prev) =>
      checked
        ? [...prev, assistant]
        : prev.filter((a) => a.id !== assistant.id),
    );
  };

  return (
    <div className="bg-white p-4 shadow-sm">
      <div>
        <Label className="mb-2 block text-base font-medium">
          Do you want to select specific assistants for this course?
        </Label>
        <p className="text-muted-foreground mb-2 text-sm">
          You may not receive your preference
        </p>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={wantsSpecificAssistants === true ? "default" : "outline"}
            onClick={() => setWantsSpecificAssistants(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={wantsSpecificAssistants === false ? "default" : "outline"}
            onClick={() => {
              setWantsSpecificAssistants(false);
              setPreferences([]);
            }}
          >
            No
          </Button>
        </div>
      </div>

      {wantsSpecificAssistants && (
        <div className="space-y-3 border-t pt-2">
          <Label className="text-sm font-medium">
            Select your preferred assistants
          </Label>

          {availableAssistants.map((staff) => {
            const isSelected = selectedPreferences.includes(staff);

            return (
              <div
                key={staff.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {staff.name}
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                      {staff.roles.map((r) => r.role)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{staff.email}</p>
                </div>
                <input
                  type="checkbox"
                  id={`${sectionId}-${staff.id}`}
                  checked={isSelected}
                  onChange={(e) =>
                    handleAssistantChange(staff, e.target.checked)
                  }
                  className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
