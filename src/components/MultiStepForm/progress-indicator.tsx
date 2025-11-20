interface ProgressIndicatorProps {
  step: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  step,
  totalSteps,
}) => {
  return (
    <div className="mb-4 flex justify-center">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`mx-1 h-2 w-8 rounded ${
            i < step ? "bg-blue-600" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
};

export default ProgressIndicator;
