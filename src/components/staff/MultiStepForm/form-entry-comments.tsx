"use client";
import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface FormEntryCommentsProps {
  userId: string;
  termId: string;
  prevData: string;
  onChange: (comments: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const FormEntryComments: React.FC<FormEntryCommentsProps> = ({
  userId,
  termId,
  prevData,
  onChange,
  onSubmit,
  onBack,
}) => {
  const [comments, setComments] = useState(prevData);
  const utils = api.useUtils();
  const saveFormMutation = api.studentForm.saveStudentForm.useMutation({
    onError: (error) => {
      console.error("Failed to save comments:", error);
    },
    onSuccess: () => {
      // onChange(comments); could save here if using local storage. otherwise no point
      toast.success("Form saved successfully");
      void utils.studentDashboard.invalidate();
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

  function handleBackClick() {
    onChange(comments);
    onBack();
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
      <div className="mt-4 flex justify-between">
        <Button
          onClick={handleBackClick}
          variant="outline"
          disabled={saveFormMutation.isPending}
        >
          Back
        </Button>
        <Button
          onClick={handleSubmitClick}
          disabled={saveFormMutation.isPending}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default FormEntryComments;
