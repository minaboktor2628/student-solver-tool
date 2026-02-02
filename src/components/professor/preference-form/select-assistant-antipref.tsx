"use client";

import React from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import type { Assistant } from "@/types/professor";
import { normalize } from "@/lib/utils";
import { XIcon } from "lucide-react";

type SelectAssistantPreferenceProps = {
  sectionId: string;
  availableAssistants: Assistant[];
  avoidedStaff?: Assistant[];
  onChange: (sectionId: string, preferredStaff: Assistant[]) => void;
};

export const SelectAssistantAntipref: React.FC<
  SelectAssistantPreferenceProps
> = ({ sectionId, availableAssistants, avoidedStaff, onChange }) => {
  const [wantsAntiPreferences, setWantsAntiPreferences] =
    React.useState<boolean>((avoidedStaff?.length ?? 0) > 0);
  const toggleAssistant = (assistant: Assistant, checked: boolean) => {
    const newStaff = checked
      ? [...(avoidedStaff ?? []), assistant]
      : (avoidedStaff ?? []).filter((a) => a.id !== assistant.id);
    onChange(sectionId, newStaff);
  };
  const [searchTerm, setSearchTerm] = React.useState("");
  const filteredStaff = React.useMemo(() => {
    let result = availableAssistants;

    const q = normalize(searchTerm).trim();
    if (!q) return result;

    const tokens = q.split(/\s+/).filter(Boolean);
    return result.filter((s) => {
      const name = normalize(s.name ?? "");
      const email = normalize(s.email ?? "");
      return tokens.every((t) => name.includes(t) || email.includes(t));
    });
  }, [availableAssistants, searchTerm]);

  return (
    <div className="p-4 shadow-sm">
      <div>
        <Label className="mb-2 block text-base font-medium">
          Do you have any assistants that you do not want for this course?
        </Label>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={wantsAntiPreferences === true ? "default" : "outline"}
            onClick={() => setWantsAntiPreferences(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={wantsAntiPreferences === false ? "default" : "outline"}
            onClick={() => {
              setWantsAntiPreferences(false);
              onChange(sectionId, []);
            }}
          >
            No
          </Button>
        </div>
      </div>

      {wantsAntiPreferences && (
        <div>
          <div className="space-y-3 border-t pt-2">
            <Label className="text-sm font-medium">
              Select your preferred assistants
            </Label>
            <div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="search"
                placeholder="Search staff..."
                className="pr-8"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {filteredStaff.map((staff) => {
              return (
                <div
                  key={staff.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    avoidedStaff?.some((a) => a.id === staff.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {staff.name}
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                        {staff.roles}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {staff.email}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id={`${sectionId}-${staff.id}`}
                    checked={avoidedStaff?.some((a) => a.id === staff.id)}
                    onChange={(e) => toggleAssistant(staff, e.target.checked)}
                    className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
