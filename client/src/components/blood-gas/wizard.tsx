import { useWizard } from "./wizard-context";
import { StepIndicator } from "./step-indicator";
import { Flowchart } from "./flowchart";
import {
  StepPH,
  StepGases,
  StepAnionGap,
  StepOsmolarGap,
  StepCompensation,
  StepDiagnosis,
} from "./steps";

function StepContent() {
  const { currentStep } = useWizard();

  switch (currentStep) {
    case 1:
      return <StepPH />;
    case 2:
      return <StepGases />;
    case 3:
      return <StepAnionGap />;
    case 4:
      return <StepOsmolarGap />;
    case 5:
      return <StepCompensation />;
    case 6:
      return <StepDiagnosis />;
    default:
      return <StepPH />;
  }
}

export function Wizard() {
  const { currentStep } = useWizard();

  return (
    <div className="min-h-screen bg-background">
      <StepIndicator />
      
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Flowchart - only show on steps 1-5 */}
        {currentStep < 6 && (
          <div className="hidden lg:block">
            <Flowchart />
          </div>
        )}
        
        {/* Step Content */}
        <StepContent />
      </div>
    </div>
  );
}
