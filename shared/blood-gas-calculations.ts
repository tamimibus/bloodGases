import type {
  BloodGasInput,
  pHStatus,
  PrimaryDisorder,
  AnionGapStatus,
  AnionGapResult,
  OsmolarGapResult,
  WintersFormulaResult,
  DeltaRatioResult,
  CompensationResult,
  CompensationStatus,
  Chronicity,
  BloodGasInterpretation,
} from "./schema";
import {
  respiratoryAcidosisCauses,
  metabolicAcidosisCauses,
  respiratoryAlkalosisCauses,
  metabolicAlkalosisCauses,
  normalRanges,
} from "./schema";

export function determinepHStatus(pH: number): pHStatus {
  if (pH < 7.35) return "acidaemia";
  if (pH > 7.45) return "alkalaemia";
  return "normal";
}

export function calculateAnionGap(
  Na: number,
  Cl: number,
  HCO3: number,
  albumin?: number
): AnionGapResult {
  const normNa = Number(Na);
  const normCl = Number(Cl);
  const normHCO3 = Number(HCO3);
  const normAlbumin = albumin !== undefined ? Number(albumin) : undefined;

  const rawAG = normNa - (normCl + normHCO3);
  const formula = `AG = [Na⁺] - ([Cl⁻] + [HCO₃⁻]) = ${normNa} - (${normCl} + ${normHCO3}) = ${rawAG}`;

  let correctedAG = rawAG;
  let correctionFormula: string | undefined;

  if (normAlbumin !== undefined && normAlbumin < 4) {
    const correction = 2.5 * (4 - normAlbumin);
    correctedAG = rawAG + correction;
    correctionFormula = `Corrected AG = ${rawAG} + 2.5 × (4 - ${normAlbumin}) = ${correctedAG.toFixed(1)}`;
  }

  let status: AnionGapStatus;
  if (correctedAG > 16) {
    status = "high";
  } else if (correctedAG < 3) {
    status = "low_negative";
  } else {
    status = "normal";
  }

  return {
    value: rawAG,
    correctedValue: correctedAG,
    status,
    formula,
    correctionFormula,
  };
}

export function calculateOsmolarGap(
  measuredOsmolality: number,
  Na: number,
  glucose: number,
  urea: number,
  ethanol?: number
): OsmolarGapResult {
  const normMeasuredOsm = Number(measuredOsmolality);
  const normNa = Number(Na);
  const normGlucose = Number(glucose);
  const normUrea = Number(urea);
  const normEthanol = ethanol !== undefined ? Number(ethanol) : undefined;

  let calculatedOsm = 2 * normNa + normGlucose + normUrea;
  let formula = `Calculated Osm = 2×[Na⁺] + Glucose + Urea = 2×${normNa} + ${normGlucose} + ${normUrea}`;

  if (normEthanol && normEthanol > 0) {
    calculatedOsm += normEthanol;
    formula += ` + ${normEthanol}`;
  }

  formula += ` = ${calculatedOsm.toFixed(1)} mOsm/kg`;

  const gap = normMeasuredOsm - calculatedOsm;

  return {
    calculatedOsmolality: calculatedOsm,
    measuredOsmolality: normMeasuredOsm,
    gap,
    isElevated: gap > 10,
    formula,
  };
}

export function calculateWintersFormula(
  HCO3: number,
  actualPCO2: number
): WintersFormulaResult {
  const normHCO3 = Number(HCO3);
  const normActualPCO2 = Number(actualPCO2);

  const expectedPCO2 = 1.5 * normHCO3 + 8;
  const expectedLow = expectedPCO2 - 2;
  const expectedHigh = expectedPCO2 + 2;

  let status: CompensationStatus;
  if (normActualPCO2 >= expectedLow && normActualPCO2 <= expectedHigh) {
    status = "appropriate";
  } else if (normActualPCO2 < expectedLow) {
    status = "excessive";
  } else {
    status = "inadequate";
  }

  return {
    expectedPCO2Low: expectedLow,
    expectedPCO2High: expectedHigh,
    actualPCO2: normActualPCO2,
    status,
    formula: `Expected pCO₂ = (1.5 × ${normHCO3}) + 8 ± 2 = ${expectedLow.toFixed(
      1
    )} - ${expectedHigh.toFixed(1)} mmHg`,
  };
}

export function calculateDeltaRatio(
  anionGap: number,
  HCO3: number
): DeltaRatioResult {
  const normAG = Number(anionGap);
  const normHCO3 = Number(HCO3);

  const deltaAG = normAG - 12;
  const deltaHCO3 = 24 - normHCO3;

  if (deltaHCO3 === 0) {
    return {
      value: 0,
      status: "hagma",
      interpretation: "Pure HAGMA (no HCO3 change)",
      formula: `Delta Ratio = (${normAG} - 12) / (24 - ${normHCO3}) = Cannot calculate (no HCO3 change)`,
    };
  }

  const deltaRatio = deltaAG / deltaHCO3;
  const formula = `Delta Ratio = (AG - 12) / (24 - HCO₃⁻) = (${normAG} - 12) / (24 - ${normHCO3}) = ${deltaRatio.toFixed(
    2
  )}`;

  let status: DeltaRatioResult["status"];
  let interpretation: string;

  if (deltaRatio < 0.4) {
    status = "pure_nagma_hagma";
    interpretation = "Pure NAGMA & HAGMA (hyperchloraemic acidosis)";
  } else if (deltaRatio >= 0.4 && deltaRatio < 0.8) {
    status = "mixed_nagma_hagma";
    interpretation = "Mixed NAGMA & HAGMA";
  } else if (deltaRatio >= 0.8 && deltaRatio <= 2.0) {
    status = "hagma";
    interpretation =
      "Pure HAGMA (HAGMA alone or metabolic alkalosis or respiratory acidosis)";
  } else {
    status = "hagma_metabolic_alkalosis";
    interpretation = "HAGMA with metabolic alkalosis or respiratory acidosis";
  }

  return {
    value: deltaRatio,
    status,
    interpretation,
    formula,
  };
}

export function calculateRespiratoryCompensation(
  disorder: "respiratory_acidosis" | "respiratory_alkalosis",
  pCO2: number,
  HCO3: number
): CompensationResult {
  const normPCO2 = Number(pCO2);
  const normHCO3 = Number(HCO3);

  const normalPCO2 = 40;
  const normalHCO3 = 24;
  const pCO2Change = Math.abs(normPCO2 - normalPCO2);
  const HCO3Change = normHCO3 - normalHCO3;

  let expectedHCO3Change: number;
  let rule: string;
  let chronicity: Chronicity;
  let status: CompensationStatus;

  if (disorder === "respiratory_acidosis") {
    const acuteExpected = (pCO2Change / 10) * 1;
    const chronicExpected = (pCO2Change / 10) * 4;

    if (Math.abs(HCO3Change - acuteExpected) <= 2) {
      chronicity = "acute";
      expectedHCO3Change = acuteExpected;
      rule = `Acute: For every 10mmHg pCO₂ rise above 40, expect HCO₃⁻ to increase by 1mmol/L`;
      status = "appropriate";
    } else if (Math.abs(HCO3Change - chronicExpected) <= 2) {
      chronicity = "chronic";
      expectedHCO3Change = chronicExpected;
      rule = `Chronic: For every 10mmHg pCO₂ rise above 40, expect HCO₃⁻ to increase by 4mmol/L`;
      status = "appropriate";
    } else if (HCO3Change > chronicExpected + 2) {
      chronicity = "unknown";
      expectedHCO3Change = chronicExpected;
      rule = `Chronic expected: HCO₃⁻ increase of ${chronicExpected.toFixed(1)}mmol/L`;
      status = "excessive";
    } else {
      chronicity = "unknown";
      expectedHCO3Change = acuteExpected;
      rule = `Expected: HCO₃⁻ increase of ${acuteExpected.toFixed(1)} (acute) to ${chronicExpected.toFixed(1)} (chronic) mmol/L`;
      status = "inadequate";
    }
  } else {
    const acuteExpected = (pCO2Change / 10) * -2;
    const chronicExpected = (pCO2Change / 10) * -5;

    if (Math.abs(HCO3Change - acuteExpected) <= 2) {
      chronicity = "acute";
      expectedHCO3Change = acuteExpected;
      rule = `Acute: For every 10mmHg pCO₂ fall below 40, expect HCO₃⁻ to decrease by 2mmol/L`;
      status = "appropriate";
    } else if (Math.abs(HCO3Change - chronicExpected) <= 2) {
      chronicity = "chronic";
      expectedHCO3Change = chronicExpected;
      rule = `Chronic: For every 10mmHg pCO₂ fall below 40, expect HCO₃⁻ to decrease by 5mmol/L`;
      status = "appropriate";
    } else if (HCO3Change < chronicExpected - 2) {
      chronicity = "unknown";
      expectedHCO3Change = chronicExpected;
      rule = `Chronic expected: HCO₃⁻ decrease of ${Math.abs(chronicExpected).toFixed(1)}mmol/L`;
      status = "excessive";
    } else {
      chronicity = "unknown";
      expectedHCO3Change = acuteExpected;
      rule = `Expected: HCO₃⁻ decrease of ${Math.abs(acuteExpected).toFixed(1)} (acute) to ${Math.abs(chronicExpected).toFixed(1)} (chronic) mmol/L`;
      status = "inadequate";
    }
  }

  return {
    expectedChange: `${expectedHCO3Change >= 0 ? "+" : ""}${expectedHCO3Change.toFixed(1)} mmol/L`,
    actualChange: `${HCO3Change >= 0 ? "+" : ""}${HCO3Change.toFixed(1)} mmol/L`,
    status,
    chronicity,
    rule,
  };
}

export function calculateMetabolicAlkalosisCompensation(
  HCO3: number,
  actualPCO2: number
): CompensationResult {
  const normHCO3 = Number(HCO3);
  const normActualPCO2 = Number(actualPCO2);

  const expectedPCO2 = 0.7 * normHCO3 + 20;
  const expectedLow = expectedPCO2 - 5;
  const expectedHigh = expectedPCO2 + 5;

  let status: CompensationStatus;
  if (normActualPCO2 >= expectedLow && normActualPCO2 <= expectedHigh) {
    status = "appropriate";
  } else if (normActualPCO2 > expectedHigh) {
    status = "excessive";
  } else {
    status = "inadequate";
  }

  return {
    expectedChange: `Expected pCO₂: ${expectedLow.toFixed(1)} - ${expectedHigh.toFixed(1)} mmHg`,
    actualChange: `Actual pCO₂: ${normActualPCO2} mmHg`,
    status,
    chronicity: "unknown",
    rule: `Expected pCO₂ = (0.7 × ${normHCO3}) + 20 ± 5 = ${expectedLow.toFixed(1)} - ${expectedHigh.toFixed(1)} mmHg`,
  };
}

export function determinePrimaryDisorder(
  pH: number,
  pCO2: number,
  HCO3: number
): PrimaryDisorder {
  const normPH = Number(pH);
  const normPCO2 = Number(pCO2);
  const normHCO3 = Number(HCO3);

  const phStatus = determinepHStatus(normPH);

  // Check if all parameters are within normal ranges
  const isStrictNormal =
    normPH >= normalRanges.pH.low &&
    normPH <= normalRanges.pH.high &&
    normPCO2 >= normalRanges.pCO2.low &&
    normPCO2 <= normalRanges.pCO2.high &&
    normHCO3 >= normalRanges.HCO3.low &&
    normHCO3 <= normalRanges.HCO3.high;

  if (isStrictNormal) {
    return "normal";
  }

  let effectiveStatus = phStatus;

  // If pH is normal but components are abnormal, determine tendency
  if (phStatus === "normal") {
    if (normPH < 7.4) {
      effectiveStatus = "acidaemia";
    } else if (normPH > 7.4) {
      effectiveStatus = "alkalaemia";
    } else {
      // pH === 7.4
      // Determine based on dominant abnormal respiratory component first
      if (normPCO2 > normalRanges.pCO2.high) {
        effectiveStatus = "acidaemia";
      } else if (normPCO2 < normalRanges.pCO2.low) {
        effectiveStatus = "alkalaemia";
      } else if (normHCO3 < normalRanges.HCO3.low) {
        effectiveStatus = "acidaemia";
      } else if (normHCO3 > normalRanges.HCO3.high) {
        effectiveStatus = "alkalaemia";
      }
    }
  }

  if (effectiveStatus === "acidaemia") {
    if (normPCO2 > 45) {
      return "respiratory_acidosis";
    }
    if (normHCO3 < 22) {
      return "metabolic_acidosis";
    }
    if (normPCO2 > 45 && normHCO3 < 22) {
      const pCO2Deviation = (normPCO2 - 40) / 40;
      const HCO3Deviation = (24 - normHCO3) / 24;
      return pCO2Deviation > HCO3Deviation
        ? "respiratory_acidosis"
        : "metabolic_acidosis";
    }
    return normPCO2 > 45 ? "respiratory_acidosis" : "metabolic_acidosis";
  }

  if (effectiveStatus === "alkalaemia") {
    if (normPCO2 < 35) {
      return "respiratory_alkalosis";
    }
    if (normHCO3 > 26) {
      return "metabolic_alkalosis";
    }
    if (normPCO2 < 35 && normHCO3 > 26) {
      const pCO2Deviation = (40 - normPCO2) / 40;
      const HCO3Deviation = (normHCO3 - 24) / 24;
      return pCO2Deviation > HCO3Deviation
        ? "respiratory_alkalosis"
        : "metabolic_alkalosis";
    }
    return normPCO2 < 35 ? "respiratory_alkalosis" : "metabolic_alkalosis";
  }

  return "normal";
}


export function getCausesForDisorder(
  disorder: PrimaryDisorder,
  anionGapStatus?: AnionGapStatus,
  chronicity?: Chronicity
): string[] {
  switch (disorder) {
    case "respiratory_acidosis":
      if (chronicity === "chronic") {
        return respiratoryAcidosisCauses.chronic;
      }
      return respiratoryAcidosisCauses.acute;

    case "metabolic_acidosis":
      if (anionGapStatus === "high") {
        return metabolicAcidosisCauses.highAGMA.causes;
      } else if (anionGapStatus === "low_negative") {
        return metabolicAcidosisCauses.lowNegativeAGMA;
      }
      return metabolicAcidosisCauses.normalAGMA.causes;

    case "respiratory_alkalosis":
      return respiratoryAlkalosisCauses.causes;

    case "metabolic_alkalosis":
      return metabolicAlkalosisCauses.causes;

    default:
      return [];
  }
}

export function getMnemonicForDisorder(
  disorder: PrimaryDisorder,
  anionGapStatus?: AnionGapStatus
): string | null {
  switch (disorder) {
    case "metabolic_acidosis":
      if (anionGapStatus === "high") {
        return metabolicAcidosisCauses.highAGMA.mnemonic;
      }
      return metabolicAcidosisCauses.normalAGMA.mnemonic;

    case "respiratory_alkalosis":
      return respiratoryAlkalosisCauses.mnemonic;

    case "metabolic_alkalosis":
      return metabolicAlkalosisCauses.mnemonic;

    default:
      return null;
  }
}

export function formatDisorderName(disorder: PrimaryDisorder): string {
  const names: Record<PrimaryDisorder, string> = {
    respiratory_acidosis: "Respiratory Acidosis",
    metabolic_acidosis: "Metabolic Acidosis",
    respiratory_alkalosis: "Respiratory Alkalosis",
    metabolic_alkalosis: "Metabolic Alkalosis",
    normal: "Normal",
  };
  return names[disorder];
}

export function getDisorderColorClass(disorder: PrimaryDisorder): string {
  switch (disorder) {
    case "respiratory_acidosis":
    case "respiratory_alkalosis":
      return "clinical-blue";
    case "metabolic_acidosis":
    case "metabolic_alkalosis":
      return "clinical-orange";
    default:
      return "clinical-green";
  }
}

export function interpretBloodGas(
  input: BloodGasInput
): BloodGasInterpretation | null {
  const { pH, pCO2, HCO3, Na, Cl, albumin, measuredOsmolality, glucose, urea, ethanol } =
    input;

  if (pH === undefined || pCO2 === undefined || HCO3 === undefined) {
    return null;
  }

  const phStatus = determinepHStatus(pH);
  const primaryDisorder = determinePrimaryDisorder(pH, pCO2, HCO3);

  let anionGap: AnionGapResult | undefined;
  let osmolarGap: OsmolarGapResult | undefined;
  let wintersFormula: WintersFormulaResult | undefined;
  let deltaRatio: DeltaRatioResult | undefined;
  let compensation: CompensationResult | undefined;

  if (Na !== undefined && Cl !== undefined) {
    if (primaryDisorder === "metabolic_acidosis" || phStatus === "normal") {
      anionGap = calculateAnionGap(Na, Cl, HCO3, albumin);
    }
  }

  if (
    measuredOsmolality !== undefined &&
    Na !== undefined &&
    glucose !== undefined &&
    urea !== undefined
  ) {
    osmolarGap = calculateOsmolarGap(measuredOsmolality, Na, glucose, urea, ethanol);
  }

  if (primaryDisorder === "metabolic_acidosis" && anionGap) {
    wintersFormula = calculateWintersFormula(HCO3, pCO2);

    if (anionGap.status === "high") {
      deltaRatio = calculateDeltaRatio(anionGap.correctedValue, HCO3);
    }
  } else if (primaryDisorder === "metabolic_alkalosis") {
    compensation = calculateMetabolicAlkalosisCompensation(HCO3, pCO2);
  } else if (
    primaryDisorder === "respiratory_acidosis" ||
    primaryDisorder === "respiratory_alkalosis"
  ) {
    compensation = calculateRespiratoryCompensation(primaryDisorder, pCO2, HCO3);
  }

  const causes = getCausesForDisorder(
    primaryDisorder,
    anionGap?.status,
    compensation?.chronicity
  );

  const secondaryDisorders: string[] = [];
  if (wintersFormula?.status === "excessive") {
    secondaryDisorders.push("Concurrent respiratory alkalosis");
  } else if (wintersFormula?.status === "inadequate") {
    secondaryDisorders.push("Concurrent respiratory acidosis");
  }

  if (compensation?.status === "excessive") {
    if (primaryDisorder === "respiratory_acidosis") {
      secondaryDisorders.push("Concurrent metabolic alkalosis");
    } else if (primaryDisorder === "respiratory_alkalosis") {
      secondaryDisorders.push("Concurrent metabolic acidosis");
    } else if (primaryDisorder === "metabolic_alkalosis") {
      secondaryDisorders.push("Concurrent respiratory acidosis");
    }
  } else if (compensation?.status === "inadequate") {
    if (primaryDisorder === "respiratory_acidosis") {
      secondaryDisorders.push("Concurrent metabolic acidosis");
    } else if (primaryDisorder === "respiratory_alkalosis") {
      secondaryDisorders.push("Concurrent metabolic alkalosis");
    } else if (primaryDisorder === "metabolic_alkalosis") {
      secondaryDisorders.push("Concurrent respiratory alkalosis");
    }
  }

  // Special handling for pH 7.4: Display both diagnoses with metabolic issue as secondary
  if (pH === 7.4) {
    if (primaryDisorder === "respiratory_acidosis" && !secondaryDisorders.includes("Concurrent metabolic alkalosis")) {
      secondaryDisorders.push("Concurrent metabolic alkalosis");
    } else if (primaryDisorder === "respiratory_alkalosis" && !secondaryDisorders.includes("Concurrent metabolic acidosis")) {
      secondaryDisorders.push("Concurrent metabolic acidosis");
    }
  }

  if (deltaRatio?.status === "mixed_nagma_hagma" || deltaRatio?.status === "pure_nagma_hagma") {
    secondaryDisorders.push("Mixed HAGMA and NAGMA");
  } else if (deltaRatio?.status === "hagma_metabolic_alkalosis") {
    secondaryDisorders.push("Concurrent metabolic alkalosis");
  }

  let summary = `${formatDisorderName(primaryDisorder)}`;

  // Check if strict normal (all parameters within normal range)
  const isStrictNormal =
    pH >= normalRanges.pH.low && pH <= normalRanges.pH.high &&
    pCO2 >= normalRanges.pCO2.low && pCO2 <= normalRanges.pCO2.high &&
    HCO3 >= normalRanges.HCO3.low && HCO3 <= normalRanges.HCO3.high;

  if (isStrictNormal) {
    summary = "No acid-base disturbance";
  } else if (primaryDisorder === "normal") {
    // Normal pH but abnormal components (Mixed or Compensated)
    // For now, keep it as "Normal" or maybe "Normal pH (Mixed Disorder?)"
    // The requirement focuses on "If the 3 numbers ... are within normal limit"
    summary = "Normal pH (Possible mixed disorder/compensated)";
  }

  if (anionGap && primaryDisorder === "metabolic_acidosis") {
    summary += ` with ${anionGap.status === "high" ? "elevated" : anionGap.status === "normal" ? "normal" : "low"} anion gap`;
  }
  if (compensation?.chronicity && compensation.chronicity !== "unknown") {
    summary = `${compensation.chronicity.charAt(0).toUpperCase() + compensation.chronicity.slice(1)} ${summary}`;
  }
  if (secondaryDisorders.length > 0) {
    summary += ` (${secondaryDisorders.join("; ")})`;
  }

  return {
    input,
    pHStatus: phStatus,
    primaryDisorder,
    anionGap,
    osmolarGap,
    wintersFormula,
    deltaRatio,
    compensation,
    causes,
    secondaryDisorders,
    summary,
  };
}

export function validateHendersonHasselbalch(
  pH: number,
  pCO2: number,
  HCO3: number
): { isValid: boolean; calculatedPH: number; difference: number } {
  const normPH = Number(pH);
  const normPCO2 = Number(pCO2);
  const normHCO3 = Number(HCO3);

  // Henderson-Hasselbalch equation: pH = 6.1 + log10(HCO3 / (0.03 * pCO2))
  const calculatedPH = 6.1 + Math.log10(normHCO3 / (0.03 * normPCO2));
  const difference = Math.abs(normPH - calculatedPH);

  // Consider valid if difference is within 0.03
  return {
    isValid: difference <= 0.03,
    calculatedPH: parseFloat(calculatedPH.toFixed(3)),
    difference: parseFloat(difference.toFixed(3)),
  };
}

export function calculateCorrectedSodium(Na: number, glucose: number): number {
  const normNa = Number(Na);
  const normGlucose = Number(glucose);

  const glucose_mg_dl = normGlucose * 18.01802;
  // Formula: Na + 0.02 * (Glucose_mg - 100)
  const correctedNa = normNa + 0.02 * (glucose_mg_dl - 100);
  return parseFloat(correctedNa.toFixed(1));
}

export function calculateCorrectedPotassium(K: number, pH: number): number {
  const normK = Number(K);
  const normPH = Number(pH);

  const phDifference = 7.4 - normPH;
  // Each 0.1 unit pH change -> 0.6 unit K change inverse
  // If pH < 7.4 (acidosis), K shifts out (measured is high), so Corrected should be lower?
  // User Formula: K - 0.6 * ([ 7.4-PH ]/0.1)
  // Example: pH 7.2. Diff = 0.2. Steps = 2. Adjustment = 1.2.
  // Result = K - 1.2. (Matches expected logic: acidosis causes hyperkalemia, so true K is lower)
  const adjustment = 0.6 * (phDifference / 0.1);
  const correctedK = normK - adjustment;
  return parseFloat(correctedK.toFixed(1));
}
