import { ArrowLeft, ArrowRight, Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "../wizard-context";
import { cn } from "@/lib/utils";

export function StepCompensation() {
  const { interpretation, goToNextStep, goToPreviousStep } = useWizard();

  const wintersFormula = interpretation?.wintersFormula;
  const deltaRatio = interpretation?.deltaRatio;
  const compensation = interpretation?.compensation;

  const getCompensationStatus = (status: string | undefined) => {
    const statuses: Record<string, { label: string; description: string; color: string; icon: typeof TrendingUp }> = {
      appropriate: {
        label: "Appropriate Compensation",
        description: "The compensatory response is within expected range for the primary disorder.",
        color: "text-clinical-green",
        icon: Minus,
      },
      inadequate: {
        label: "Inadequate Compensation",
        description: "The compensatory response is less than expected, suggesting a concurrent secondary disorder.",
        color: "text-clinical-orange",
        icon: TrendingDown,
      },
      excessive: {
        label: "Excessive Compensation",
        description: "The compensatory response is greater than expected, suggesting a concurrent secondary disorder.",
        color: "text-clinical-red",
        icon: TrendingUp,
      },
      mixed_disorder: {
        label: "Mixed Acid-Base Disorder",
        description: "Multiple primary disorders are present simultaneously.",
        color: "text-clinical-purple",
        icon: Scale,
      },
    };
    return statuses[status || "appropriate"];
  };

  const getDeltaRatioInfo = (status: string | undefined) => {
    const statuses: Record<string, { label: string; description: string; range: string }> = {
      pure_nagma_hagma: {
        label: "Pure NAGMA & HAGMA",
        description: "Hyperchloraemic acidosis with possible concurrent HAGMA",
        range: "< 0.4",
      },
      mixed_nagma_hagma: {
        label: "Mixed NAGMA & HAGMA",
        description: "Both high anion gap and normal anion gap acidosis present",
        range: "0.4 - 0.8",
      },
      hagma: {
        label: "Pure HAGMA",
        description: "Uncomplicated high anion gap metabolic acidosis",
        range: "0.8 - 2.0",
      },
      hagma_metabolic_alkalosis: {
        label: "HAGMA + Metabolic Alkalosis",
        description: "High anion gap acidosis with concurrent metabolic alkalosis or pre-existing respiratory acidosis",
        range: "> 2.0",
      },
    };
    return statuses[status || "hagma"];
  };

  const compensationInfo = getCompensationStatus(wintersFormula?.status || compensation?.status);
  const deltaRatioInfo = deltaRatio ? getDeltaRatioInfo(deltaRatio.status) : null;
  const CompIcon = compensationInfo.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Scale className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Step 5: Compensation Analysis</CardTitle>
              <CardDescription>
                Evaluate whether compensation is appropriate or if secondary disorders exist
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Winter's Formula (for Metabolic Acidosis) */}
          {wintersFormula && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Winter's Formula (Expected pCO₂)
              </h3>
              
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-2">Formula:</p>
                <p className="font-mono text-base">
                  Expected pCO₂ = (1.5 × [HCO₃⁻]) + 8 ± 2
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border">
                <p className="font-mono text-sm">{wintersFormula.formula}</p>
              </div>

              <div className="flex items-center justify-center gap-8 p-6 rounded-lg bg-muted/30">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Expected pCO₂</p>
                  <p className="text-2xl font-bold font-mono">
                    {wintersFormula.expectedPCO2Low.toFixed(1)} - {wintersFormula.expectedPCO2High.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">mmHg</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Actual pCO₂</p>
                  <p className={cn(
                    "text-3xl font-bold font-mono",
                    wintersFormula.status === "appropriate" ? "text-clinical-green" :
                    wintersFormula.status === "inadequate" ? "text-clinical-orange" :
                    "text-clinical-red"
                  )}>
                    {wintersFormula.actualPCO2}
                  </p>
                  <p className="text-sm text-muted-foreground">mmHg</p>
                </div>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-l-4 flex items-start gap-3",
                  wintersFormula.status === "appropriate"
                    ? "bg-clinical-green-light border-clinical-green"
                    : wintersFormula.status === "inadequate"
                    ? "bg-clinical-orange-light border-clinical-orange"
                    : "bg-clinical-red-light border-clinical-red"
                )}
                data-testid="winters-formula-interpretation"
              >
                <CompIcon className={cn("w-5 h-5 shrink-0 mt-0.5", compensationInfo.color)} />
                <div>
                  <p className={cn("font-bold text-lg", compensationInfo.color)}>
                    {compensationInfo.label}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1">
                    {wintersFormula.status === "appropriate"
                      ? "Respiratory compensation is appropriate for the metabolic acidosis."
                      : wintersFormula.status === "inadequate"
                      ? "Actual pCO₂ is higher than expected, suggesting concurrent respiratory acidosis."
                      : "Actual pCO₂ is lower than expected, suggesting concurrent respiratory alkalosis."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delta Ratio (for HAGMA) */}
          {deltaRatio && deltaRatioInfo && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Delta Ratio Analysis
              </h3>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-2">Formula:</p>
                <p className="font-mono text-base">
                  Delta Ratio = (AG - 12) / (24 - HCO₃⁻)
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border">
                <p className="font-mono text-sm">{deltaRatio.formula}</p>
              </div>

              <div className="flex items-center justify-center p-6 rounded-lg bg-muted/30">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Delta Ratio</p>
                  <p className="text-4xl font-bold font-mono text-primary">
                    {deltaRatio.value.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Range: {deltaRatioInfo.range}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-bold text-lg text-primary">{deltaRatioInfo.label}</p>
                <p className="text-sm text-foreground/80 mt-1">{deltaRatioInfo.description}</p>
              </div>

              {/* Delta Ratio Reference Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Delta Ratio</th>
                      <th className="text-left py-2 px-3">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={cn("border-b", deltaRatio.value < 0.4 && "bg-primary/10")}>
                      <td className="py-2 px-3 font-mono">{"< 0.4"}</td>
                      <td className="py-2 px-3">Pure NAGMA & HAGMA</td>
                    </tr>
                    <tr className={cn("border-b", deltaRatio.value >= 0.4 && deltaRatio.value < 0.8 && "bg-primary/10")}>
                      <td className="py-2 px-3 font-mono">0.4 - 0.8</td>
                      <td className="py-2 px-3">Mixed NAGMA & HAGMA</td>
                    </tr>
                    <tr className={cn("border-b", deltaRatio.value >= 0.8 && deltaRatio.value <= 2.0 && "bg-primary/10")}>
                      <td className="py-2 px-3 font-mono">0.8 - 2.0</td>
                      <td className="py-2 px-3">Pure HAGMA</td>
                    </tr>
                    <tr className={cn(deltaRatio.value > 2.0 && "bg-primary/10")}>
                      <td className="py-2 px-3 font-mono">{"> 2.0"}</td>
                      <td className="py-2 px-3">HAGMA + Metabolic Alkalosis or Respiratory Acidosis</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* General Compensation (for respiratory disorders) */}
          {compensation && !wintersFormula && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Compensation Assessment
              </h3>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium">{compensation.rule}</p>
              </div>

              <div className="flex items-center justify-center gap-8 p-6 rounded-lg bg-muted/30">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Expected HCO₃⁻ Change</p>
                  <p className="text-xl font-bold font-mono">{compensation.expectedChange}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Actual HCO₃⁻ Change</p>
                  <p className={cn(
                    "text-xl font-bold font-mono",
                    compensation.status === "appropriate" ? "text-clinical-green" : "text-clinical-orange"
                  )}>
                    {compensation.actualChange}
                  </p>
                </div>
              </div>

              {compensation.chronicity !== "unknown" && (
                <div className="p-4 rounded-lg bg-clinical-blue-light border-l-4 border-clinical-blue">
                  <p className="font-bold text-clinical-blue capitalize">
                    {compensation.chronicity} Process
                  </p>
                  <p className="text-sm text-foreground/80 mt-1">
                    The compensation pattern suggests this is a {compensation.chronicity} process.
                  </p>
                </div>
              )}

              <div
                className={cn(
                  "p-4 rounded-lg border-l-4 flex items-start gap-3",
                  compensation.status === "appropriate"
                    ? "bg-clinical-green-light border-clinical-green"
                    : compensation.status === "inadequate"
                    ? "bg-clinical-orange-light border-clinical-orange"
                    : "bg-clinical-red-light border-clinical-red"
                )}
                data-testid="compensation-interpretation"
              >
                <CompIcon className={cn("w-5 h-5 shrink-0 mt-0.5", compensationInfo.color)} />
                <div>
                  <p className={cn("font-bold text-lg", compensationInfo.color)}>
                    {compensationInfo.label}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1">
                    {compensationInfo.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No compensation data available */}
          {!wintersFormula && !deltaRatio && !compensation && (
            <div className="text-center py-8 text-muted-foreground">
              <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Insufficient data for compensation analysis.</p>
              <p className="text-sm mt-2">
                Complete the previous steps to enable compensation calculations.
              </p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={goToPreviousStep}
              data-testid="button-previous-step"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={goToNextStep}
              data-testid="button-next-step"
            >
              View Diagnosis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
