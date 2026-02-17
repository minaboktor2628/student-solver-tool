"use client";
import { useState } from "react";
import FormEntryAvailability from "./form-entry-availability";
import FormEntryTimes from "./form-entry-times";
import ProgressIndicator from "./progress-indicator";
import FormEntryQualifications from "./form-entry-qualifications";
import FormEntryPreferences from "./form-entry-preferences";
import FormEntryComments from "./form-entry-comments";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

interface MultiStepFormModalProps {
  onClose?: () => void;
  /** If true, render inline (no fixed overlay) so the form can be used as a full page */
  inline?: boolean;
  /** Required: user ID of the authenticated user */
  userId: string;
  termId: string;
}

const MultiStepFormModal: React.FC<MultiStepFormModalProps> = ({
  onClose,
  inline = false,
  userId,
  termId,
}) => {
  // Data collected from each step, initialized from database
  const [qualifiedSections, setQualifiedSectionIds] = useState<string[]>([]);
  const router = useRouter();

  const [{ term }] = api.studentDashboard.getTermInfo.useSuspenseQuery({
    termId: selectedTermId ?? "",
  });
  const [{ canEdit }] = api.studentForm.getCanEdit.useSuspenseQuery({
    userId: userId ?? "",
  });

  // fetch sections for the selected term and pass to qualifications UI
  const [{ sections }] = api.studentForm.getSections.useSuspenseQuery({
    termId,
  });

  const [step, setStep] = useState(1);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = () => {
    router.push("/");
    onClose?.();
  };

  const cantEditContainer = (
    // <div className="h-auto w-full overflow-y-auto rounded-2xl p-6">
    //   <h1>Preferences Form locked for {term.termLetter} Term {term.year}</h1>
    // </div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold">
        Preferences Form is closed for {term.termLetter} Term {term.year}
      </h1>
      <p className="text-muted-foreground mt-2">
        The coordinator has locked the form, and edits cannot be made at this
        time.
      </p>
    </div>
  );
  if (!canEdit?.canEditForm) {
    if (inline) return cantEditContainer;
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="border-foreground bg-background h-[600px] w-[90vw] max-w-2xl overflow-y-auto rounded-2xl border p-10 shadow-lg">
        {cantEditContainer}
      </div>
    </div>;
  }
  const container = (
    <div className="h-auto w-full overflow-y-auto rounded-2xl p-6">
      <ProgressIndicator step={step} totalSteps={5} />
      {step === 1 && (
        // doesnt need initial data, can always start form with available/not
        <FormEntryAvailability
          userId={userId}
          termId={termId}
          onNext={handleNext}
          onExit={handleSubmit}
        />
      )}
      {step === 2 && (
        //TODO pass in initial times data
        <FormEntryTimes
          userId={userId}
          termId={termId}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {step === 3 && (
        <FormEntryQualifications
          userId={userId}
          termId={termId}
          courses={sections}
          onChange={(ids) => setQualifiedSectionIds(ids)}
          onNext={handleNext}
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      )}
      {step === 4 && (
        //TODO pass in initial prefs
        <FormEntryPreferences
          userId={userId}
          termId={termId}
          courses={sections}
          selectedSectionIds={qualifiedSections}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {step === 5 && (
        //TODO pass in initial comments
        <FormEntryComments
          userId={userId}
          termId={termId}
          onSubmit={handleSubmit}
          onBack={handleBack}
        />
      )}
    </div>
  );

  if (inline) {
    return container;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="border-foreground bg-background h-[600px] w-[90vw] max-w-2xl overflow-y-auto rounded-2xl border p-10 shadow-lg">
        {container}
      </div>
    </div>
  );
};

export default MultiStepFormModal;
