"use client";
import React, { useEffect, useState } from "react";
import MultiStepFormModal from "./multi-step-form-modal";

const FormTriggerButton = () => {
  const [open, setOpen] = React.useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user ID from the API endpoint
    const fetchUserId = async () => {
      try {
        const response = await fetch("/api/user");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId);
        }
      } catch (error) {
        console.error("Failed to fetch user ID:", error);
      }
    };

    fetchUserId();
  }, []);

  if (!userId) {
    return null; // Don't show button until we have userId
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Open Form
      </button>
      {open && (
        <MultiStepFormModal userId={userId} onClose={() => setOpen(false)} />
      )}
    </>
  );
};

export default FormTriggerButton;
