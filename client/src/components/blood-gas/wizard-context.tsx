import { createContext, useContext, useState, useCallback } from "react";
import type { BloodGasInput, BloodGasInterpretation } from "@shared/schema";
import { interpretBloodGas } from "@/lib/blood-gas-logic";

export type WizardStep = 1 | 2 | 3 | 4;

interface WizardContextType {
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;
  input: BloodGasInput;
  updateInput: (updates: Partial<BloodGasInput>) => void;
  interpretation: BloodGasInterpretation | null;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  reset: () => void;
  canProceed: () => boolean;
  getStepPath: () => string[];
  isAnionGapStepRelevant: () => boolean;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const initialInput: BloodGasInput = {};

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [input, setInput] = useState<BloodGasInput>(initialInput);

  const updateInput = useCallback((updates: Partial<BloodGasInput>) => {
    setInput((prev) => ({ ...prev, ...updates }));
  }, []);

  const interpretation = input.pH !== undefined &&
    input.pCO2 !== undefined &&
    input.HCO3 !== undefined
    ? interpretBloodGas(input)
    : null;

  /* Helper to check if AG step is relevant */
  const isAnionGapStepRelevant = useCallback(() => {
    if (input.pH === undefined || input.pCO2 === undefined || input.HCO3 === undefined) {
      // If we don't have basic inputs, we can't decide, so default to not skipping (or maybe skipping until we know?)
      // Actually, if we don't have inputs, we are on Step 1, so it matters for forward nav from Step 1.
      // But determining disorder requires inputs.
      // Let's rely on stored interpretation if available, or calculate on the fly?
      // interpretation uses interpretBloodGas which is memoized/derived above.
      return true; // Default to relevant if no data
    }

    // Use interpretation logic
    // We need to match the logic: Met Acidosis OR Normal pH
    const phStatus = input.pH < 7.35 ? "acidaemia" : input.pH > 7.45 ? "alkalaemia" : "normal";

    // Simple check for Normal pH
    if (phStatus === "normal") return true;

    // Check for Metabolic Acidosis
    // We can rely on 'interpretation' variable derived above or re-derive disorder.
    // 'interpretation' is derived from 'input'.
    if (interpretation?.primaryDisorder === "metabolic_acidosis") return true;

    return false;
  }, [input, interpretation]);

  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => {
      let nextStep = Math.min(prev + 1, 4) as WizardStep;

      // If we are moving to Step 2, check if we should skip it
      if (nextStep === 2 && !isAnionGapStepRelevant()) {
        nextStep = 3;
      }
      return nextStep;
    });
  }, [isAnionGapStepRelevant]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => {
      let prevStep = Math.max(prev - 1, 1) as WizardStep;

      // If we are moving back to Step 2, check if we should skip it (go back to 1)
      if (prevStep === 2 && !isAnionGapStepRelevant()) {
        prevStep = 1;
      }
      return prevStep;
    });
  }, [isAnionGapStepRelevant]);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setInput(initialInput);
  }, []);

  const canProceed = useCallback(() => {
    return true;
  }, []);

  const getStepPath = useCallback(() => {
    const path: string[] = [];

    if (input.pH !== undefined) {
      if (input.pH < 7.35) {
        path.push("acidaemia");
      } else if (input.pH > 7.45) {
        path.push("alkalaemia");
      } else {
        path.push("normal");
      }
    }

    if (interpretation) {
      path.push(interpretation.primaryDisorder);

      if (interpretation.anionGap) {
        path.push(`ag_${interpretation.anionGap.status}`);
      }
    }

    return path;
  }, [input, interpretation]);

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        input,
        updateInput,
        interpretation,
        goToNextStep,
        goToPreviousStep,
        reset,
        canProceed,
        getStepPath,
        isAnionGapStepRelevant,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
