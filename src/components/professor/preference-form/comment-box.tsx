"use client";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";

export type ProfessorCommentBoxProps = {
  sectionId: string;
  initialComment: string | undefined | null;
  onChange: (sectionId: string, comments: string | null) => void;
};

export const FormEntryComments: React.FC<ProfessorCommentBoxProps> = ({
  sectionId,
  initialComment,
  onChange,
}) => {
  const [comments, setComments] = useState<string | null>(initialComment ?? "");
  const toggleComments = (comment: string | null) => {
    setComments(comment);
    onChange(sectionId, comment);
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-semibold">Any additional comments?</h2>
      <Textarea
        value={comments ?? ""}
        onChange={(e) => toggleComments(e.target.value)}
        placeholder="Please leave any additional comments here..."
        rows={4}
      />
    </div>
  );
};
