"use client";

import React, { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import type { User } from "next-auth";

type SelectAssistantPreferenceProps = {
  title: string;
  description: string;
  sectionId: string;
  availableAssistants: User[];
  selectedStaff: User[];
  onChange: (selectedStaff: User[]) => void;
};

export const SelectAssistantPref: React.FC<SelectAssistantPreferenceProps> = ({
  title,
  description,
  sectionId,
  availableAssistants,
  selectedStaff,
  onChange,
}) => {
  const [enabled, setEnabled] = useState(selectedStaff.length > 0);

  const byId = useMemo(() => {
    const m = new Map<string, User>();
    for (const a of availableAssistants) m.set(a.id, a);
    return m;
  }, [availableAssistants]);

  const selectedIds = useMemo(
    () => selectedStaff.map((a) => a.id),
    [selectedStaff],
  );
  return (
    <div>
      <Item className="px-0">
        <ItemContent>
          <ItemTitle>{title}</ItemTitle>
          <ItemDescription>{description}</ItemDescription>
        </ItemContent>
        <ItemActions>
          No
          <Switch
            checked={enabled}
            onCheckedChange={(next) => {
              setEnabled(next);
              if (!next) onChange([]);
            }}
          />
          Yes
        </ItemActions>
      </Item>
      {enabled && (
        <Combobox
          items={availableAssistants}
          multiple
          value={selectedIds}
          itemToStringLabel={(id) => byId.get(id)?.name ?? ""}
          onValueChange={(next) => {
            const ids = Array.isArray(next) ? next : next ? [next] : [];
            const staff = ids
              .map((id) => byId.get(id))
              .filter((user): user is User => user != undefined);
            onChange(staff);
          }}
        >
          <ComboboxChips>
            <ComboboxValue>
              {selectedIds.map((id) => (
                <ComboboxChip key={`${sectionId}-${id}`}>
                  {byId.get(id)?.name ?? id}
                </ComboboxChip>
              ))}
            </ComboboxValue>
            <ComboboxChipsInput placeholder="Select staff..." />
          </ComboboxChips>
          <ComboboxContent>
            <ComboboxEmpty>No staff found.</ComboboxEmpty>
            <ComboboxList>
              {(assistant: User) => (
                <ComboboxItem
                  key={`${sectionId}-${assistant.id}`}
                  value={assistant.id}
                >
                  <Item size="sm" className="p-0">
                    <ItemContent>
                      <ItemTitle className="whitespace-nowrap">
                        {assistant.name}{" "}
                        <Badge variant="outline">
                          {assistant.roles?.join(", ")}
                        </Badge>
                      </ItemTitle>
                      <ItemDescription>{assistant.email}</ItemDescription>
                    </ItemContent>
                  </Item>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}
    </div>
  );
};
