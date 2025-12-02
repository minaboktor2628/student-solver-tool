"use client";
import React, { useEffect, useMemo, useState } from "react";

interface FormEntryCommentsProps {
  text?: string;
  onSubmit?: () => void;
  onExit?: () => void;
}

const FormEntryComments: React.FC<FormEntryCommentsProps> = ({
  text,
  onSubmit,
  onExit,
}) => {
  return (
    <div className="mx-auto max-w-4xl p-4">
      <h2 className="mb-4 text-xl font-semibold">Comments</h2>
      <textarea
        className="w-full rounded-lg border border-gray-300 p-3"
        placeholder="Please leave any additional comments here..."
        rows={4}
      />
      <div className="mt-4 flex gap-3">
        {onSubmit && (
          <button
            onClick={onSubmit}
            className="bg-primary/70 hover:bg-primary/100 rounded-lg px-4 py-2 text-white"
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
