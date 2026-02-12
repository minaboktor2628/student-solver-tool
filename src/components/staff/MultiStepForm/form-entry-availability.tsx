import { api } from "@/trpc/react";
import { useTerm } from "@/components/term-combobox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const updateAvailabilityMutation =
    api.studentForm.setAvailabilityForTerm.useMutation({
      onError: (error) => {
        console.error("Failed to update availability:", error);
      },
      onSuccess: () => {
        toast.success("Form saved successfully");
      },
    });

  function handleYNClick(answer: boolean) {
    updateAvailabilityMutation.mutate({
      userId,
      termId,
      isAvailable: answer,
    });
    if (answer === true) onNext();
    else onExit();
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
          disabled={updateAvailabilityMutation.isPending}
        >
          Yes
        </Button>
        <Button
          onClick={() => handleYNClick(false)}
          variant="outline"
          disabled={updateAvailabilityMutation.isPending}
        >
          No
        </Button>
      </div>
    </div>
  );
};

export default FormEntryAvailability;
