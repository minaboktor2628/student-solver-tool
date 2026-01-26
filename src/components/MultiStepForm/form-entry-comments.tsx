"use client";
import React, { useState } from "react";
import { api } from "@/trpc/react";

interface FormEntryCommentsProps {
  userId: string;
  termId: string;
  initialText?: string;
  onSubmit?: () => void;
  onExit?: () => void;
}

const FormEntryComments: React.FC<FormEntryCommentsProps> = ({
  userId,
  termId,
  initialText,
  onSubmit,
  onExit,
}) => {
  const [comments, setComments] = useState(initialText ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation();

  async function handleSubmitClick() {
    setIsSaving(true);
    try {
      await saveFormMutation.mutateAsync({
        userId,
        termId,
        comments,
      });
      onSubmit?.();
    } catch (error) {
      console.error("Failed to save comments:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h2 className="mb-4 text-xl font-semibold">Comments</h2>
      <textarea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-3"
        placeholder="Please leave any additional comments here..."
        rows={4}
      />
      <div className="mt-4 flex gap-3">
        {onSubmit && (
          <button
            onClick={handleSubmitClick}
            disabled={isSaving}
            className="bg-primary/70 hover:bg-primary/100 rounded-lg px-4 py-2 text-white disabled:opacity-50"
          >
            Submit
          </button>
        )}
        {onExit && (
          <button
            onClick={onExit}
            className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default FormEntryComments;
