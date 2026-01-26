import { api } from "@/trpc/react";
import { useTerm } from "../term-combobox";
import { Button } from "../ui/button";
import { useState } from "react";

interface AvailabilityProps {
  onNext: () => void;
  onExit: () => void;
  userId: string;
  termId: string;
}

const FormEntryAvailability: React.FC<AvailabilityProps> = ({
  userId,
  termId,
  onNext,
  onExit,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const updateAvailabilityMutation =
    api.studentForm.setAvailabilityForTerm.useMutation();

  async function handleYNClick(answer: boolean) {
    setIsSaving(true);
    try {
      await updateAvailabilityMutation.mutateAsync({
        userId,
        termId,
        isAvailable: answer,
      });
      if (answer === true) onNext();
      else onExit();
    } catch (error) {
      console.error("Failed to save availability:", error);
    } finally {
      setIsSaving(false);
    }
  }

  const { selectedTerm } = useTerm();
  return (
    <div className="text-center">
      <h2 className="mb-4 text-xl font-semibold">
        Are you available to work for {selectedTerm?.termLetter} term{" "}
        {selectedTerm?.year}?
      </h2>
      <div className="flex flex-col justify-center gap-4">
        <Button
          onClick={() => handleYNClick(true)}
          className=""
          disabled={isSaving}
        >
          Yes
        </Button>
        <Button
          onClick={() => handleYNClick(false)}
          variant="outline"
          disabled={isSaving}
        >
          No
        </Button>
      </div>
    </div>
  );
};

export default FormEntryAvailability;
