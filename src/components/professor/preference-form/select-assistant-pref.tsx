"use client";

import React, { useId } from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import type { Assistant } from "@/types/professor";
import { normalize } from "@/lib/utils";
import { XIcon } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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
  }, [availableAssistants, avoidedStaff, searchTerm]);

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
          {preferredStaff && preferredStaff.length > 0 && (
            <div className="pt-2">
              <p className="text-sm font-medium">
                List of preferred assistants:{" "}
                {preferredStaff.map((s) => s.name).join(", ")}
              </p>
            </div>
          )}
          <div className="space-y-3 pt-2">
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
              <FieldGroup className="gap-2">
                {filteredStaff.length === 0 ? (
                  <p>No staff.</p>
                ) : (
                  filteredStaff.map((staff) => {
                    const checked =
                      preferredStaff?.some((a) => a.id === staff.id) ?? false;

                    return (
                      <FieldLabel key={staff.id}>
                        <Field orientation="horizontal">
                          <FieldContent className="gap-0">
                            <FieldTitle>
                              {staff.name}{" "}
                              <Badge variant="secondary">
                                {staff.roles.join(", ")}
                              </Badge>
                            </FieldTitle>
                            <FieldDescription>{staff.email}</FieldDescription>
                          </FieldContent>

                          <Checkbox
                            id={`${sectionId}-${staff.id}`}
                            checked={checked}
                            onCheckedChange={(next) => {
                              toggleAssistant(staff, next === true);
                            }}
                          />
                        </Field>
                      </FieldLabel>
                    );
                  })
                )}
              </FieldGroup>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
