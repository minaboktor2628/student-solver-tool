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

interface MultiStepFormModalProps {
  onClose?: () => void;
  /** If true, render inline (no fixed overlay) so the form can be used as a full page */
  inline?: boolean;
  /** Required: user ID of the authenticated user */
  userId: string;
  /** Optional context: staff and term to load data for */
  staffId?: string;
  termLetter?: "A" | "B" | "C" | "D";
  year?: number;
}

const MultiStepFormModal: React.FC<MultiStepFormModalProps> = ({
  onClose,
  inline = false,
  userId,
  staffId,
  termLetter,
  year,
}) => {
  // Data collected from each step, initialized from database
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklySlot[]>(
    [],
  );
  const [qualifiedSections, setQualifiedSectionIds] = useState<string[]>([]);
  const [courseTokenMapping, setCourseTokenMapping] = useState<
    Record<string, "prefer" | "strong" | undefined>
  >({});
  const [comments, setComments] = useState<string>("");
  const router = useRouter();

  // fetch sections for the selected term and pass to qualifications UI
  const sectionsQ = api.studentForm.getSections.useQuery({
    termLetter: termLetter ?? "A",
    year: year ?? 2025,
  });

  const [step, setStep] = useState(1);
  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));
  const handleExit = () => onClose?.();

  const handleSubmit = () => {
    // TODO: persist the collected form data via tRPC/prisma
    // For now, navigate back to home after submit and close modal if present
    router.push("/");
    onClose?.();
  };

  const container = (
    <div className="h-auto w-full overflow-y-auto rounded-2xl p-6">
      <ProgressIndicator step={step} totalSteps={5} />
      {step === 1 && (
        <FormEntryAvailability onNext={handleNext} onExit={handleExit} />
        //TODO get out availability data (boolean)
      )}
      {step === 2 && (
        //TODO pass in initial times data
        <FormEntryTimes
          userId={userId}
          termLetter={termLetter ?? "A"}
          year={year ?? 2025}
          qualifiedSectionIds={qualifiedSections}
          sectionPreferences={courseTokenMapping}
          comments={comments}
          onNext={handleNext}
          onExit={() => setStep(1)}
          onSave={(weekly) => setWeeklyAvailability(weekly)}
        />
      )}
      {step === 3 && (
        // pass server-provided course list into qualifications UI
        // TODO pass in previous qualifications data
        <FormEntryQualifications
          userId={userId}
          termLetter={termLetter ?? "A"}
          year={year ?? 2025}
          courses={sectionsQ.data?.courses}
          onNext={handleNext}
          onExit={() => setStep(2)}
          onChange={(ids) => setQualifiedSectionIds(ids)}
        />
      )}
      {step === 4 && (
        //TODO pass in initial preferences data
        <FormEntryPreferences
          userId={userId}
          termLetter={termLetter ?? "A"}
          year={year ?? 2025}
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
        //TODO get out preferences data
      )}
      {step === 5 && (
        //TODO pass in initial comments data
        <FormEntryComments
          userId={userId}
          termLetter={termLetter ?? "A"}
          year={year ?? 2025}
          initialText={comments}
          onSubmit={handleSubmit}
          onExit={() => setStep(4)}
        />
        //TODO get out comments data
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
