import { createContext, useContext, useState, useCallback } from "react";
import type { BloodGasInput, BloodGasInterpretation } from "@shared/schema";
import { interpretBloodGas } from "@/lib/blood-gas-logic";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

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

  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 5) as WizardStep);
  }, []);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as WizardStep);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setInput(initialInput);
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return input.pH !== undefined && input.pCO2 !== undefined && input.HCO3 !== undefined;
      case 2:
        return input.Na !== undefined && input.Cl !== undefined;
      case 3:
        return true; // Osmolar gap is optional
      case 4:
        return true; // Compensation is auto-calculated
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentStep, input]);

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
