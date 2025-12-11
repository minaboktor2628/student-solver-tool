import { Button } from "../ui/button";

interface AvailabilityProps {
  termLetter: "A" | "B" | "C" | "D";
  year: number;
  userRole: string;
  onNext: () => void;
  onExit: () => void;
}

const FormEntryAvailability: React.FC<AvailabilityProps> = ({
  termLetter,
  year,
  userRole,
  onNext,
  onExit,
}) => {
  return (
    <div className="text-center">
      <h2 className="mb-4 text-xl font-semibold">
        Are you available to work as a {userRole} for {termLetter} term {year}?
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
