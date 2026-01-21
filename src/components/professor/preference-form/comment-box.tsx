"use client";
import React, { useState } from "react";
import type { ProfessorCommentBoxProps } from "@/types/professor";

export const FormEntryComments: React.FC<ProfessorCommentBoxProps> = ({
  sectionId,
  initialComment,
}) => {
  const [comments, setComments] = useState(initialComment ?? "");

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-semibold">Any additional comments?</h2>
      <textarea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-3"
        placeholder="Please leave any additional comments here..."
        rows={4}
      />
    </div>
  );
};
