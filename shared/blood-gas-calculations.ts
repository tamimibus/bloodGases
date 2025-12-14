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

export function determinePrimaryDisorder(
  pH: number,
  pCO2: number,
  HCO3: number
): PrimaryDisorder {
  const phStatus = determinepHStatus(pH);

  if (phStatus === "normal") {
    return "normal";
  }

  if (phStatus === "acidaemia") {
    if (pCO2 > 45) {
      return "respiratory_acidosis";
    }
    if (HCO3 < 22) {
      return "metabolic_acidosis";
    }
    if (pCO2 > 45 && HCO3 < 22) {
      const pCO2Deviation = (pCO2 - 40) / 40;
      const HCO3Deviation = (24 - HCO3) / 24;
      return pCO2Deviation > HCO3Deviation
        ? "respiratory_acidosis"
        : "metabolic_acidosis";
    }
    return pCO2 > 45 ? "respiratory_acidosis" : "metabolic_acidosis";
  }

  if (phStatus === "alkalaemia") {
    if (pCO2 < 35) {
      return "respiratory_alkalosis";
    }
    if (HCO3 > 26) {
      return "metabolic_alkalosis";
    }
    if (pCO2 < 35 && HCO3 > 26) {
      const pCO2Deviation = (40 - pCO2) / 40;
      const HCO3Deviation = (HCO3 - 24) / 24;
      return pCO2Deviation > HCO3Deviation
        ? "respiratory_alkalosis"
        : "metabolic_alkalosis";
    }
    return pCO2 < 35 ? "respiratory_alkalosis" : "metabolic_alkalosis";
  }

  return "normal";
}

export function calculateAnionGap(
  Na: number,
  Cl: number,
  HCO3: number,
  albumin?: number
): AnionGapResult {
  const rawAG = Na - (Cl + HCO3);
  const formula = `AG = [Na⁺] - ([Cl⁻] + [HCO₃⁻]) = ${Na} - (${Cl} + ${HCO3}) = ${rawAG}`;

  let correctedAG = rawAG;
  let correctionFormula: string | undefined;

  if (albumin !== undefined && albumin < 4) {
    const correction = 2.5 * (4 - albumin);
    correctedAG = rawAG + correction;
    correctionFormula = `Corrected AG = ${rawAG} + 2.5 × (4 - ${albumin}) = ${correctedAG.toFixed(1)}`;
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
  let calculatedOsm = 2 * Na + glucose + urea;
  let formula = `Calculated Osm = 2×[Na⁺] + Glucose + Urea = 2×${Na} + ${glucose} + ${urea}`;

  if (ethanol && ethanol > 0) {
    calculatedOsm += ethanol / 4.6;
    formula += ` + (${ethanol}/4.6)`;
  }

  formula += ` = ${calculatedOsm.toFixed(1)} mOsm/kg`;

  const gap = measuredOsmolality - calculatedOsm;

  return {
    calculatedOsmolality: calculatedOsm,
    measuredOsmolality,
    gap,
    isElevated: gap > 10,
    formula,
  };
}

export function calculateWintersFormula(
  HCO3: number,
  actualPCO2: number
): WintersFormulaResult {
  const expectedPCO2 = 1.5 * HCO3 + 8;
  const expectedLow = expectedPCO2 - 2;
  const expectedHigh = expectedPCO2 + 2;

  let status: CompensationStatus;
  if (actualPCO2 >= expectedLow && actualPCO2 <= expectedHigh) {
    status = "appropriate";
  } else if (actualPCO2 < expectedLow) {
    status = "excessive";
  } else {
    status = "inadequate";
  }

  return {
    expectedPCO2Low: expectedLow,
    expectedPCO2High: expectedHigh,
    actualPCO2,
    status,
    formula: `Expected pCO₂ = (1.5 × ${HCO3}) + 8 ± 2 = ${expectedLow.toFixed(
      1
    )} - ${expectedHigh.toFixed(1)} mmHg`,
  };
}

export function calculateDeltaRatio(
  anionGap: number,
  HCO3: number
): DeltaRatioResult {
  const deltaAG = anionGap - 12;
  const deltaHCO3 = 24 - HCO3;

  if (deltaHCO3 === 0) {
    return {
      value: 0,
      status: "hagma",
      interpretation: "Pure HAGMA (no HCO3 change)",
      formula: `Delta Ratio = (${anionGap} - 12) / (24 - ${HCO3}) = Cannot calculate (no HCO3 change)`,
    };
  }

  const deltaRatio = deltaAG / deltaHCO3;
  const formula = `Delta Ratio = (AG - 12) / (24 - HCO₃⁻) = (${anionGap} - 12) / (24 - ${HCO3}) = ${deltaRatio.toFixed(
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
  const normalPCO2 = 40;
  const normalHCO3 = 24;
  const pCO2Change = Math.abs(pCO2 - normalPCO2);
  const HCO3Change = HCO3 - normalHCO3;

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
  const expectedPCO2 = 0.7 * HCO3 + 20;
  const expectedLow = expectedPCO2 - 5;
  const expectedHigh = expectedPCO2 + 5;

  let status: CompensationStatus;
  if (actualPCO2 >= expectedLow && actualPCO2 <= expectedHigh) {
    status = "appropriate";
  } else if (actualPCO2 > expectedHigh) {
    status = "excessive";
  } else {
    status = "inadequate";
  }

  return {
    expectedChange: `Expected pCO₂: ${expectedLow.toFixed(1)} - ${expectedHigh.toFixed(1)} mmHg`,
    actualChange: `Actual pCO₂: ${actualPCO2} mmHg`,
    status,
    chronicity: "unknown",
    rule: `Expected pCO₂ = (0.7 × ${HCO3}) + 20 ± 5 = ${expectedLow.toFixed(1)} - ${expectedHigh.toFixed(1)} mmHg`,
  };
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
