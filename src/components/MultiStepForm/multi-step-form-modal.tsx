"use client";
import { useState } from "react";
import FormEntryAvailability from "./form-entry-availability";
import FormEntryTimes from "./form-entry-times";
import type { WeeklySlot } from "./form-entry-times";
import ProgressIndicator from "./progress-indicator";
import FormEntryQualifications from "./form-entry-qualifications";
import FormEntryPreferences from "./form-entry-preferences";

interface MultiStepFormModalProps {
  onClose?: () => void;
  /** If true, render inline (no fixed overlay) so the form can be used as a full page */
  inline?: boolean;
}

const MultiStepFormModal: React.FC<MultiStepFormModalProps> = ({
  onClose,
  inline = false,
}) => {
  const [step, setStep] = useState(1);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklySlot[]>(
    [],
  );
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [courseTokenMapping, setCourseTokenMapping] = useState<
    Record<string, string | undefined>
  >({});

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));
  const handleExit = () => onClose?.();

  const container = (
    <div className="h-auto w-full overflow-y-auto rounded-2xl p-6">
      <ProgressIndicator step={step} totalSteps={4} />
      {step === 1 && (
        <FormEntryAvailability onNext={handleNext} onExit={handleExit} />
      )}
      {step === 2 && (
        <FormEntryTimes
          onNext={handleNext}
          onExit={() => setStep(1)}
          onSave={(weekly) => setWeeklyAvailability(weekly)}
        />
      )}
      {step === 3 && (
        <FormEntryQualifications
          onNext={handleNext}
          onExit={() => setStep(2)}
          onChange={(ids) => setSelectedSectionIds(ids)}
        />
      )}
      {step === 4 && (
        <FormEntryPreferences
          selectedSectionIds={selectedSectionIds}
          onNext={handleNext}
          onExit={() => setStep(3)}
          onChange={(m) =>
            setCourseTokenMapping(m as Record<string, string | undefined>)
          }
        />
      )}
    </div>
  );

  if (inline) {
    return container;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="h-[600px] w-[90vw] max-w-2xl overflow-y-auto rounded-2xl bg-white p-10 shadow-lg">
        {container}
      </div>
    </div>
  );
};

export default MultiStepFormModal;
