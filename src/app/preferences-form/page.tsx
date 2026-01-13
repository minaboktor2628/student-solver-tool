import FormTriggerButton from "@/components/MultiStepForm/form-trigger-button";
import React from "react";

export const metadata = {
  title: "Preferences Form",
  description: "Form for TAs and PLAs to set their preferences",
};

export default function PreferencesFormPage() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Preferences Form</h1>
      <p>
        This is where the preferences form for TAs and PLAs will be implemented.
      </p>
      <FormTriggerButton />
    </div>
  );
}
