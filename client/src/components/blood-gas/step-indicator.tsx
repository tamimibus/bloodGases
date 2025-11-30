import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard } from "./wizard-context";

const steps = [
  { number: 1, title: "pH Analysis", shortTitle: "pH" },
  { number: 2, title: "pCO₂ & HCO₃⁻", shortTitle: "Gases" },
  { number: 3, title: "Anion Gap", shortTitle: "AG" },
  { number: 4, title: "Osmolar Gap", shortTitle: "OG" },
  { number: 5, title: "Compensation", shortTitle: "Comp" },
  { number: 6, title: "Diagnosis", shortTitle: "Result" },
];

export function StepIndicator() {
  const { currentStep, setCurrentStep, input } = useWizard();

  const isStepComplete = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return input.pH !== undefined;
      case 2:
        return input.pCO2 !== undefined && input.HCO3 !== undefined;
      case 3:
        return input.Na !== undefined && input.Cl !== undefined;
      case 4:
        return currentStep > 4;
      case 5:
        return currentStep > 5;
      default:
        return false;
    }
  };

  const canClickStep = (stepNumber: number) => {
    if (stepNumber === 1) return true;
    if (stepNumber <= currentStep) return true;
    // Can only go to next step if current is complete
    for (let i = 1; i < stepNumber; i++) {
      if (!isStepComplete(i)) return false;
    }
    return true;
  };

  return (
    <div className="w-full bg-card border-b border-border sticky top-0 z-50" data-testid="step-indicator">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between gap-2">
            {steps.map((step, index) => {
              const isComplete = isStepComplete(step.number);
              const isCurrent = currentStep === step.number;
              const isClickable = canClickStep(step.number);
              const isUpcoming = step.number > currentStep && !isComplete;

              return (
                <li key={step.number} className="flex-1 relative">
                  {/* Connector line */}
                  {index > 0 && (
                    <div
                      className={cn(
                        "absolute left-0 top-4 -translate-x-1/2 w-full h-0.5 -z-10",
                        isComplete || isCurrent || step.number <= currentStep
                          ? "bg-primary"
                          : "bg-border"
                      )}
                      style={{ width: "calc(100% + 0.5rem)", left: "-0.5rem" }}
                    />
                  )}

                  <button
                    onClick={() => isClickable && setCurrentStep(step.number as 1 | 2 | 3 | 4 | 5 | 6)}
                    disabled={!isClickable}
                    className={cn(
                      "flex flex-col items-center gap-1 w-full transition-all duration-200",
                      isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    )}
                    data-testid={`step-${step.number}`}
                  >
                    {/* Step circle */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 relative z-10",
                        isComplete && !isCurrent
                          ? "bg-clinical-green text-white"
                          : isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : isUpcoming
                          ? "bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground/40"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isComplete && !isCurrent ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                    </div>

                    {/* Step title */}
                    <span
                      className={cn(
                        "text-xs font-medium text-center transition-colors",
                        isCurrent
                          ? "text-foreground"
                          : isComplete
                          ? "text-clinical-green"
                          : "text-muted-foreground"
                      )}
                    >
                      <span className="hidden sm:inline">{step.title}</span>
                      <span className="sm:hidden">{step.shortTitle}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}
