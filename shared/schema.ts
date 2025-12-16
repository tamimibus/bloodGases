import { z } from "zod";

// Blood gas input values schema
export const bloodGasInputSchema = z.object({
  pH: z.number().min(6.8).max(7.8).optional(),
  pCO2: z.number().min(10).max(100).optional(),
  HCO3: z.number().min(5).max(45).optional(),
  Na: z.number().min(100).max(180).optional(),
  Cl: z.number().min(70).max(130).optional(),
  albumin: z.number().min(1).max(6).optional(),
  measuredOsmolality: z.number().min(200).max(400).optional(),
  glucose: z.number().min(0).max(50).optional(),
  potassium: z.number().min(0).max(10).optional(),
  urea: z.number().min(0).max(100).optional(),
  ethanol: z.number().min(0).max(100).optional(),

  // Diagnostic screening questions
  hasKetones: z.boolean().optional(),
  hasVisionChanges: z.boolean().optional(),
  hasCalciumOxalate: z.boolean().optional(),
});

export type BloodGasInput = z.infer<typeof bloodGasInputSchema>;

// pH status
export type pHStatus = "acidaemia" | "normal" | "alkalaemia";

// Primary disorder type
export type PrimaryDisorder =
  | "respiratory_acidosis"
  | "metabolic_acidosis"
  | "respiratory_alkalosis"
  | "metabolic_alkalosis"
  | "normal";

// Anion gap classification
export type AnionGapStatus = "normal" | "high" | "low_negative";

// Delta ratio classification
export type DeltaRatioStatus = "pure_nagma_hagma" | "mixed_nagma_hagma" | "hagma" | "hagma_metabolic_alkalosis";

// Chronicity
export type Chronicity = "acute" | "chronic" | "unknown";

// Compensation status
export type CompensationStatus = "appropriate" | "inadequate" | "excessive" | "mixed_disorder";

// Calculation results
export interface AnionGapResult {
  value: number;
  correctedValue: number;
  status: AnionGapStatus;
  formula: string;
  correctionFormula?: string;
}

export interface OsmolarGapResult {
  calculatedOsmolality: number;
  measuredOsmolality: number;
  gap: number;
  isElevated: boolean;
  formula: string;
}

export interface WintersFormulaResult {
  expectedPCO2Low: number;
  expectedPCO2High: number;
  actualPCO2: number;
  status: CompensationStatus;
  formula: string;
}

export interface DeltaRatioResult {
  value: number;
  status: DeltaRatioStatus;
  interpretation: string;
  formula: string;
}

export interface CompensationResult {
  expectedChange: string;
  actualChange: string;
  status: CompensationStatus;
  chronicity: Chronicity;
  rule: string;
}

// Step data for the wizard
export interface StepData {
  step: number;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

// Full interpretation result
export interface BloodGasInterpretation {
  input: BloodGasInput;
  pHStatus: pHStatus;
  primaryDisorder: PrimaryDisorder;
  anionGap?: AnionGapResult;
  osmolarGap?: OsmolarGapResult;
  wintersFormula?: WintersFormulaResult;
  deltaRatio?: DeltaRatioResult;
  compensation?: CompensationResult;
  causes: string[];
  secondaryDisorders: string[];
  summary: string;
}

// Causes data
export const respiratoryAcidosisCauses = {
  acute: [
    "CNS depression (head injury, stroke, drugs)",
    "Respiratory depression (myopathy, spinal cord injury, drugs)",
    "Hypoventilation (pain, chest wall injury/deformity, raised intra-abdominal pressures)",
    "Respiratory failure (pneumonia, pneumothorax, oedema, bronchial obstruction)",
    "Airway obstruction"
  ],
  chronic: [
    "COPD",
    "Restrictive lung disease"
  ]
};

export const metabolicAcidosisCauses = {
  normalAGMA: {
    mnemonic: "USED CRAP",
    causes: [
      "Ureterostomy",
      "Small bowel fistula",
      "Extra chloride",
      "Diarrhoea",
      "Carbonic anhydrase inhibitor",
      "Renal tubular acidosis",
      "Addison's disease",
      "Pancreatic duodenal fistula"
    ]
  },
  highAGMA: {
    mnemonic: "Left Total Knee Replacement / CAT MUD PILES",
    causes: [
      "Lactate, Toxins, Ketones, Renal failure",
      "Carbon monoxide, cyanide",
      "Alcoholic ketoacidosis",
      "Toluene",
      "Methanol, metformin (phenformin)",
      "Uraemia",
      "Diabetic ketoacidosis",
      "Paracetamol, pyroglutamic acid, paraldehyde, propylene glycol",
      "Isoniazid, iron",
      "Lactate (L-Lactate, D-Lactate)",
      "Ethanol, ethylene glycol",
      "Salicylates"
    ]
  },
  lowNegativeAGMA: [
    "Unmeasured anions (albumin, dilution)",
    "Unmeasured cations (Ca, Mg, K, lithium, paraproteinaemia)",
    "Pseudohyperchloraemia (bromide, iodide, salicylates, thiocyanate)",
    "Analytical error (Na, lipids, hyperviscosity)"
  ]
};

export const respiratoryAlkalosisCauses = {
  mnemonic: "CHAMPS",
  causes: [
    "CNS disease (stroke, haemorrhage, psychogenic)",
    "Hypoxia (Pneumonia, PE, asthma, altitude)",
    "Anxiety, pain",
    "Mechanical or excessive ventilation",
    "Progesterone, pregnancy",
    "Salicylates and sepsis"
  ]
};

export const metabolicAlkalosisCauses = {
  mnemonic: "CLEVER PD",
  causes: [
    "Contraction (volume contraction)",
    "Liquorice, laxative abuse",
    "Endocrine (Conn's, Cushing's)",
    "Vomiting, GI losses",
    "Excess alkali (antacids)",
    "Renal (Bartter's)",
    "Post-hypercapnia",
    "Diuretics"
  ]
};

// Normal ranges
export const normalRanges = {
  pH: { low: 7.35, high: 7.45, unit: "" },
  pCO2: { low: 35, high: 45, unit: "mmHg" },
  HCO3: { low: 22, high: 26, unit: "mmol/L" },
  Na: { low: 135, high: 145, unit: "mmol/L" },
  K: { low: 3.5, high: 5.0, unit: "mmol/L" },
  Cl: { low: 98, high: 107, unit: "mmol/L" },
  anionGap: { low: 8, high: 16, normal: 12, unit: "mEq/L" },
  osmolarGap: { low: -10, high: 10, unit: "mOsm/kg" },
  albumin: { low: 3.5, high: 5.0, normal: 4.0, unit: "g/dL" }
};
