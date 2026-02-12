"use client";
import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface FormEntryCommentsProps {
  userId: string;
  termId: string;
  onSubmit: () => void;
  onBack: () => void;
}

const FormEntryComments: React.FC<FormEntryCommentsProps> = ({
  userId,
  termId,
  onSubmit,
  onBack,
}) => {
  const [comments, setComments] = useState("");
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation({
    onError: (error) => {
      console.error("Failed to save comments:", error);
    },
    onSuccess: (success) => {
      toast.success("Form saved successfully");
      onSubmit();
    },
  });

  function handleSubmitClick() {
    saveFormMutation.mutate({
      userId,
      termId,
      comments,
    });
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h2 className="mb-4 text-xl font-semibold">Comments</h2>
      <Textarea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder="Please leave any additional comments here..."
        rows={4}
      />
      <div className="mt-4 flex gap-3">
        <Button
          onClick={handleSubmitClick}
          disabled={saveFormMutation.isPending}
        >
          Submit
        </Button>
        <Button
          onClick={onBack}
          variant="outline"
          disabled={saveFormMutation.isPending}
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default FormEntryComments;
