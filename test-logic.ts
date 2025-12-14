
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
