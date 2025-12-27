import { useEffect } from "react";
import { useWizard } from "./wizard-context";
import { trackStepView } from "@shared/analytics/analytics";
import { StepIndicator } from "./step-indicator";
import { Flowchart } from "./flowchart";
import {
  StepInitial,
  StepAnionGap,
  StepOsmolarGap,
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
      return <StepDiagnosis />;
    default:
      return <StepInitial />;
  }
}

export function Wizard() {
  const { currentStep } = useWizard();

  useEffect(() => {
    const stepNames: Record<number, string> = {
      1: "Initial Parameters",
      2: "Anion Gap",
      3: "Osmolar Gap",
      4: "Diagnosis"
    };

    trackStepView(currentStep, stepNames[currentStep] || `Step ${currentStep}`);
  }, [currentStep]);

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
