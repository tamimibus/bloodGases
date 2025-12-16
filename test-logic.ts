
import { determinePrimaryDisorder, interpretBloodGas } from "./shared/blood-gas-calculations";
import { normalRanges } from "./shared/schema";

const runTest = (name: string, input: any, expectedPrimary: string, expectedSecondary?: string) => {
    console.log(`Running test: ${name}`);

    // Test determinePrimaryDisorder if independent check is needed, 
    // but interpretBloodGas calls it, so we can check the result of interpretBloodGas.

    const result = interpretBloodGas(input);

    if (!result) {
        console.error("Result is null!");
        return;
    }

    const actualPrimary = result.primaryDisorder;
    console.log(`Primary: Expected ${expectedPrimary}, Got ${actualPrimary}`);

    if (expectedSecondary) {
        const hasSecondary = result.secondaryDisorders.some(s => s.toLowerCase().includes(expectedSecondary.toLowerCase()));
        console.log(`Secondary: Expected ${expectedSecondary}, Got ${JSON.stringify(result.secondaryDisorders)} -> ${hasSecondary ? "PASS" : "FAIL"}`);
    }

    console.log("--------------------------------");
};

runTest("Normal Patient", {
    pH: 7.4,
    pCO2: 40,
    HCO3: 24,
    Na: 140, Cl: 100 // Dummy
}, "normal");

runTest("Compensated Met Acidosis (pH < 7.4)", {
    pH: 7.39,
    pCO2: 30,
    HCO3: 18,
    Na: 140, Cl: 100
}, "metabolic_acidosis");

runTest("Compensated Resp Alkalosis (pH > 7.4)", {
    pH: 7.41,
    pCO2: 30,
    HCO3: 18,
    Na: 140, Cl: 100
}, "respiratory_alkalosis");

runTest("Mixed Disorder pH 7.4 (High pCO2)", {
    pH: 7.4,
    pCO2: 50,
    HCO3: 30, // Need HCO3 high to balance pH 7.4 approx (Ratio 20:1 check: 30/1.5 = 20. Correct.)
    Na: 140, Cl: 100
}, "respiratory_acidosis", "metabolic alkalosis");

runTest("Mixed Disorder pH 7.4 (Low pCO2)", {
    pH: 7.4,
    pCO2: 30,
    HCO3: 18, // Ratio check: 18 / 0.9 = 20. Correct.
    Na: 140, Cl: 100
}, "respiratory_alkalosis", "metabolic acidosis");

import { validateHendersonHasselbalch } from "./shared/blood-gas-calculations";

const testValidation = (name: string, pH: number, pCO2: number, HCO3: number, expectedValid: boolean) => {
    console.log(`Running validation test: ${name}`);
    const result = validateHendersonHasselbalch(pH, pCO2, HCO3);
    console.log(`Input: pH=${pH}, pCO2=${pCO2}, HCO3=${HCO3}`);
    console.log(`Calculated pH: ${result.calculatedPH.toFixed(3)}, Diff: ${result.difference.toFixed(3)}`);
    console.log(`Expected Valid: ${expectedValid}, Got: ${result.isValid}`);

    if (result.isValid === expectedValid) {
        console.log("PASS");
    } else {
        console.error("FAIL");
    }
    console.log("--------------------------------");
};

testValidation("Valid Normal", 7.4, 40, 24, true); // Calc ~7.4
testValidation("Valid Acidosis", 7.2, 60, 24, true); // Calc ~7.22. Diff 0.025 <= 0.03 -> Valid.
// 6.1 + log(24/(0.03*60)) = 6.1 + log(24/1.8) = 6.1 + log(13.33) = 6.1 + 1.12 = 7.22. 
// 7.2 vs 7.22 is 0.02 diff. Should be valid.

testValidation("Invalid Error", 7.4, 40, 10, false); // Calc: 6.1 + log(10/1.2) = 6.1 + 0.92 = 7.02. Diff 0.38 -> Invalid.

import { calculateOsmolarGap } from "./shared/blood-gas-calculations";

const testOsmolarGap = (name: string, measured: number, na: number, glucoseMg: number, ureaMg: number, ethanolMg: number) => {
    console.log(`Running Osmolar Gap test: ${name}`);
    // Convert inputs from mg/dL to mmol/L just like the UI does
    const glucoseMmol = glucoseMg / 18.01802;
    const ureaMmol = ureaMg / 2.80112;
    const ethanolMmol = ethanolMg / 4.6083;

    // Test logic expecting mmol/L inputs
    const result = calculateOsmolarGap(measured, na, glucoseMmol, ureaMmol, ethanolMmol);
    console.log(`Inputs: Measured=${measured}, Na=${na}`);
    console.log(`Inputs (mg/dL): Glu=${glucoseMg}, Urea=${ureaMg}, Eth=${ethanolMg}`);
    console.log(`Converted (mmol/L): Glu=${glucoseMmol.toFixed(2)}, Urea=${ureaMmol.toFixed(2)}, Eth=${ethanolMmol.toFixed(2)}`);
    console.log(`Calculated Osm: ${result.calculatedOsmolality.toFixed(1)}, Gap: ${result.gap.toFixed(1)}`);

    // Verification
    // Calculated Osm = 2 * Na + Glu(mmol) + Urea(mmol) + Eth(mmol)
    const expectedCalc = 2 * na + glucoseMmol + ureaMmol + ethanolMmol;
    const expectedGap = measured - expectedCalc;

    // Check if result matches logic
    const calcDiff = Math.abs(result.calculatedOsmolality - expectedCalc);
    if (calcDiff < 0.1) {
        console.log("PASS: Calculation matches formula");
    } else {
        console.error(`FAIL: Expected ${expectedCalc.toFixed(1)}, Got ${result.calculatedOsmolality.toFixed(1)}`);
    }

    // Check high gap Logic (manual check: 320 measured vs ~300 calc => 20 gap)
    if (expectedGap > 10) console.log("Gap Status: Elevated (Correct)");
    else console.log("Gap Status: Normal");

    console.log("--------------------------------");
};

testOsmolarGap("High Gap Check", 320, 140, 90, 14, 46);
// 90mg Glu = 5 mmol
// 14mg Urea = 5 mmol
// 46mg Eth = 10 mmol
// Calc = 280 + 5 + 5 + 10 = 300.
// Gap = 20.

import { calculateCorrectedSodium, calculateCorrectedPotassium } from "./shared/blood-gas-calculations";

// Add specific unit tests for helper functions
function testCorrectedElectrolytes() {
    console.log("Testing Corrected Electrolytes...");

    // Corrected Sodium
    // Na 130, Glucose 500mg/dL (27.75 mmol/L)
    // Expected: 130 + 0.02 * (500 - 100) = 130 + 0.02 * 400 = 130 + 8 = 138
    const corrNa = calculateCorrectedSodium(130, 27.75);
    if (Math.abs(corrNa - 138.0) > 0.1) {
        console.error(`Corrected Sodium Failed: Expected 138.0, got ${corrNa}`);
        process.exit(1);
    }

    // Corrected Potassium
    // pH 7.2, K 5.0
    // Diff = 0.2 units. Adjustment = 0.6 * (0.2/0.1) = 1.2.
    // Result = 5.0 - 1.2 = 3.8
    const corrK = calculateCorrectedPotassium(5.0, 7.2);
    if (Math.abs(corrK - 3.8) > 0.1) {
        console.error(`Corrected Potassium Failed: Expected 3.8, got ${corrK}`);
        process.exit(1);
    }

    console.log("Corrected Electrolytes Passed");
}

// Run the new tests
testCorrectedElectrolytes();
