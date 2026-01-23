import { useTerm } from "../term-combobox";
import { Button } from "../ui/button";

interface AvailabilityProps {
  onNext: () => void;
  onExit: () => void;
}

const FormEntryAvailability: React.FC<AvailabilityProps> = ({
  onNext,
  onExit,
}) => {
  const { selectedTerm } = useTerm();
  return (
    <div className="text-center">
      <h2 className="mb-4 text-xl font-semibold">
        Are you available to work for {selectedTerm?.termLetter} term{" "}
        {selectedTerm?.year}?
      </h2>
      <div className="flex flex-col justify-center gap-4">
        <Button onClick={onNext} className="">
          Yes
        </Button>
        <Button onClick={onExit} variant="outline">
          No
        </Button>
      </div>
    </div>
  );
};

export default FormEntryAvailability;
