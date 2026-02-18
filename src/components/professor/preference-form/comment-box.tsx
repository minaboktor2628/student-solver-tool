"use client";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

export type ProfessorCommentBoxProps = {
  comment: string | undefined;
  onChange: (comments: string) => void;
};

export const FormEntryComments: React.FC<ProfessorCommentBoxProps> = ({
  comment,
  onChange,
}) => {
  return (
    <Item className="px-0">
      <ItemContent>
        <ItemTitle>Any additional comments?</ItemTitle>
      </ItemContent>

      <Textarea
        value={comment ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Please leave any additional comments here..."
        rows={4}
      />
    </Item>
  );
};
