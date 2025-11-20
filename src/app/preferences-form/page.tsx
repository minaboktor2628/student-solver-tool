import React from "react";
import MultiStepFormModal from "@/components/MultiStepForm/multi-step-form-modal";

export const metadata = {
  title: "Preferences Form",
  description: "Form for TAs and PLAs to set their preferences",
};

export default function PreferencesFormPage() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Preferences Form</h1>
      <p className="text-muted-foreground mb-4">
        Complete the steps to set your preferences.
      </p>
      <MultiStepFormModal inline />
    </div>
  );
}
