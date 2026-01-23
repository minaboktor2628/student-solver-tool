"use client";
import { useEffect, useState } from "react";
import FormEntryAvailability from "./form-entry-availability";
import FormEntryTimes from "./form-entry-times";
import type { WeeklySlot } from "./form-entry-times";
import ProgressIndicator from "./progress-indicator";
import FormEntryQualifications from "./form-entry-qualifications";
import FormEntryPreferences from "./form-entry-preferences";
import FormEntryComments from "./form-entry-comments";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { getTokenSourceMapRange } from "typescript";
import { useTerm } from "@/components/term-combobox";

interface MultiStepFormModalProps {
  onClose?: () => void;
  /** If true, render inline (no fixed overlay) so the form can be used as a full page */
  inline?: boolean;
  /** Required: user ID of the authenticated user */
  userId: string;
  /** User role (e.g., "PLA", "TA") */
  userRole?: string;
  /** Optional context: staff and term to load data for */
  staffId?: string;
  termLetter?: "A" | "B" | "C" | "D";
  year?: number;
}

const MultiStepFormModal: React.FC<MultiStepFormModalProps> = ({
  onClose,
  inline = false,
  userId,
  userRole,
  staffId,
  termLetter,
  year,
}) => {
  // Data collected from each step, initialized from database
  const [qualifiedSections, setQualifiedSectionIds] = useState<string[]>([]);
  const [courseTokenMapping, setCourseTokenMapping] = useState<
    Record<string, "prefer" | "strong" | undefined>
  >({});
  const [comments, setComments] = useState<string>("");
  const router = useRouter();
  const { selectedId } = useTerm();

  // fetch sections for the selected term and pass to qualifications UI
  const sectionsQ = api.studentForm.getSections.useQuery({
    termId: selectedId ?? "",
  });

  // fetch previous qualifications from database
  const previousQualificationsQ = api.studentForm.getQualifications.useQuery(
    {
      userId,
      termId: selectedId ?? "",
    },
    { enabled: !!userId && !!selectedId },
  );

  const [step, setStep] = useState(1);

  // Initialize qualifications from database on first load
  useEffect(() => {
    if (
      previousQualificationsQ.data?.qualifiedSectionIds &&
      qualifiedSections.length === 0
    ) {
      setQualifiedSectionIds(previousQualificationsQ.data.qualifiedSectionIds);
    }
  }, [
    previousQualificationsQ.data?.qualifiedSectionIds,
    qualifiedSections.length,
  ]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));
  const handleExit = () => onClose?.();

  const handleSubmit = () => {
    router.push("/");
    onClose?.();
  };

  const container = (
    <div className="h-auto w-full overflow-y-auto rounded-2xl p-6">
      <ProgressIndicator step={step} totalSteps={5} />
      {step === 1 && (
        // doesnt need initial data, can always start form with available/not
        <FormEntryAvailability onNext={handleNext} onExit={handleExit} />
      )}
      {step === 2 && (
        //TODO pass in initial times data
        <FormEntryTimes
          userId={userId}
          termId={selectedId ?? ""}
          onNext={handleNext}
          onExit={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <FormEntryQualifications
          userId={userId}
          termId={selectedId ?? ""}
          courses={sectionsQ.data?.courses}
          initialSelectedSections={qualifiedSections}
          onNext={handleNext}
          onExit={() => setStep(2)}
          onChange={(ids) => setQualifiedSectionIds(ids)}
        />
      )}
      {step === 4 && (
        //TODO pass in initial prefs
        <FormEntryPreferences
          userId={userId}
          termId={selectedId ?? ""}
          qualifiedSectionIds={qualifiedSections}
          comments={comments}
          courses={sectionsQ.data?.courses}
          selectedSectionIds={qualifiedSections}
          onNext={handleNext}
          onExit={() => setStep(3)}
          onChange={(m) =>
            setCourseTokenMapping(
              m as Record<string, "prefer" | "strong" | undefined>,
            )
          }
        />
      )}
      {step === 5 && (
        //TODO pass in initial comments
        <FormEntryComments
          userId={userId}
          termId={selectedId ?? ""}
          initialText={comments}
          onSubmit={handleSubmit}
          onExit={() => setStep(4)}
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
