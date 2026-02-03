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

export const SelectAssistantPref: React.FC<SelectAssistantPreferenceProps> = ({
  sectionId,
  availableAssistants,
  preferredStaff,
  avoidedStaff,
  onChange,
}) => {
  const [wantsSpecificAssistants, setWantsSpecificAssistants] =
    React.useState<boolean>((preferredStaff?.length ?? 0) > 0);
  const toggleAssistant = (assistant: Assistant, checked: boolean) => {
    const newStaff = checked
      ? [...(preferredStaff ?? []), assistant]
      : (preferredStaff ?? []).filter((a) => a.id !== assistant.id);
    onChange(sectionId, newStaff);
  };
  const [searchTerm, setSearchTerm] = React.useState("");
  const filteredStaff = React.useMemo(() => {
    const result = availableAssistants.filter(
      (assistant) => !avoidedStaff?.some((p) => p.id === assistant.id),
    );

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
              onChange(sectionId, []);
            }}
          >
            No
          </Button>
        </div>
      </div>

      {wantsSpecificAssistants && (
        <div>
          {preferredStaff && (
            <div className="border-t pt-2">
              <Label className="text-sm font-medium">
                List of preferred assistants
              </Label>
              {preferredStaff?.map((staff) => {
                return (
                  <div key={staff.id} className="px-6 pt-2">
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
          )}
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
            <div className="max-h-96 overflow-y-auto rounded-lg border p-3">
              {filteredStaff.map((staff) => {
                return (
                  <div key={staff.id} className="p-1">
                    <div
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        preferredStaff?.some((a) => a.id === staff.id)
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
                        checked={preferredStaff?.some((a) => a.id === staff.id)}
                        onChange={(e) =>
                          toggleAssistant(staff, e.target.checked)
                        }
                        className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
