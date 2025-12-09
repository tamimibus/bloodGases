import { useWizard } from "./wizard-context";
import { StepIndicator } from "./step-indicator";
import { Flowchart } from "./flowchart";
import {
  StepInitial,
  StepAnionGap,
  StepOsmolarGap,
  StepCompensation,
  StepDiagnosis,
} from "./steps";

function StepContent() {
  const { currentStep } = useWizard();

  switch (currentStep) {
    case 1:
      return <StepInitial />;
    case 2:
      return <StepAnionGap />;
    case 3:
      return <StepOsmolarGap />;
    case 4:
      return <StepCompensation />;
    case 5:
      return <StepDiagnosis />;
    default:
      return <StepInitial />;
  }
}

export function Wizard() {
  const { currentStep } = useWizard();

  return (
    <div className="min-h-screen bg-background">
      <StepIndicator />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Flowchart - only show on steps 1-4 */}
        {/* {currentStep < 5 && (
          <div className="hidden lg:block">
            <Flowchart />
          </div>
        )} */}

        {/* Step Content */}
        <StepContent />
      </div>
    </div>
  );
}
