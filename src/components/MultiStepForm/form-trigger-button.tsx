"use client";
import React from "react";
import MultiStepFormModal from "./multi-step-form-modal";

const FormTriggerButton = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Open Form
      </button>
      {open && <MultiStepFormModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default FormTriggerButton;
