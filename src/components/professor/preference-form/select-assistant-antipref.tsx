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
  preferredStaff?: Assistant[];
  avoidedStaff?: Assistant[];
  onChange: (sectionId: string, preferredStaff: Assistant[]) => void;
};

export const SelectAssistantAntipref: React.FC<
  SelectAssistantPreferenceProps
> = ({
  sectionId,
  availableAssistants,
  preferredStaff,
  avoidedStaff,
  onChange,
}) => {
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
    const result = availableAssistants.filter(
      (assistant) => !preferredStaff?.some((p) => p.id === assistant.id),
    );

    const q = normalize(searchTerm).trim();
    if (!q) return result;

    const tokens = q.split(/\s+/).filter(Boolean);
    return result.filter((s) => {
      const name = normalize(s.name ?? "");
      const email = normalize(s.email ?? "");
      return tokens.every((t) => name.includes(t) || email.includes(t));
    });
  }, [availableAssistants, preferredStaff, searchTerm]);

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
          {avoidedStaff && avoidedStaff.length > 0 && (
            <div className="pt-2">
              <Label className="text-sm font-medium">
                List of avoided assistants
              </Label>
              <div className="flex flex-row">
                {avoidedStaff?.map((staff) => {
                  return (
                    <div key={staff.id} className="w-1/3 shrink-0 px-2 pt-2">
                      <div className="border-primary bg-primary/5 flex items-center justify-between rounded-lg border p-3">
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <Label className="pt-4 text-sm font-medium">
            Select your avoided assistants
          </Label>
          <div className="py-2">
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
          <div className="max-h-96 overflow-y-auto rounded-lg border p-3">
            {filteredStaff.length === 0 ? (
              <div className="flex items-center justify-center py-4 text-center">
                <p className="text-muted-foreground text-lg">
                  No more staff fit the criteria to be an assistant for your
                  course
                </p>
              </div>
            ) : (
              filteredStaff.map((staff) => {
                return (
                  <div key={staff.id} className="p-1">
                    <div
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
                        avoidedStaff?.some((a) => a.id === staff.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent"
                      }`}
                      onClick={() =>
                        toggleAssistant(
                          staff,
                          !avoidedStaff?.some((a) => a.id === staff.id),
                        )
                      }
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
                        onChange={() => {}}
                        className="text-primary focus:ring-primary pointer-events-none h-4 w-4 cursor-pointer rounded border-gray-300"
                        readOnly
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
