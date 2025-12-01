import { RotateCcw, FileText, AlertCircle, CheckCircle2, Stethoscope, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useWizard } from "../wizard-context";
import { formatDisorderName, getMnemonicForDisorder } from "@/lib/blood-gas-logic";
import { normalRanges } from "@shared/schema";
import { cn } from "@/lib/utils";

export function StepDiagnosis() {
  const { interpretation, input, reset } = useWizard();

  if (!interpretation) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Incomplete Data</p>
          <p className="text-muted-foreground mt-2">
            Please complete all required steps to generate a diagnosis.
          </p>
          <Button onClick={reset} className="mt-6" data-testid="button-restart">
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getDisorderColor = (disorder: string) => {
    switch (disorder) {
      case "respiratory_acidosis":
      case "respiratory_alkalosis":
        return {
          bg: "bg-clinical-blue-light",
          border: "border-clinical-blue",
          text: "text-clinical-blue",
          badge: "bg-clinical-blue text-white",
        };
      case "metabolic_acidosis":
        return {
          bg: "bg-clinical-orange-light",
          border: "border-clinical-orange",
          text: "text-clinical-orange",
          badge: "bg-clinical-orange text-white",
        };
      case "metabolic_alkalosis":
        return {
          bg: "bg-clinical-green-light",
          border: "border-clinical-green",
          text: "text-clinical-green",
          badge: "bg-clinical-green text-white",
        };
      default:
        return {
          bg: "bg-clinical-gray-light",
          border: "border-clinical-gray",
          text: "text-clinical-gray",
          badge: "bg-clinical-gray text-white",
        };
    }
  };

  const colors = getDisorderColor(interpretation.primaryDisorder);
  const mnemonic = getMnemonicForDisorder(
    interpretation.primaryDisorder,
    interpretation.anionGap?.status
  );

  return (
    <div className="space-y-6">
      {/* Primary Diagnosis Card */}
      <Card className={cn("border-l-4", colors.border)}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", colors.bg)}>
                <Stethoscope className={cn("w-6 h-6", colors.text)} />
              </div>
              <div>
                <CardTitle className="text-xl">Final Diagnosis</CardTitle>
                <CardDescription>Blood gas interpretation summary</CardDescription>
              </div>
            </div>
            <Badge className={cn("text-sm px-3 py-1", colors.badge)} data-testid="badge-disorder">
              {formatDisorderName(interpretation.primaryDisorder)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className={cn("p-4 rounded-lg", colors.bg)}>
            <p className={cn("font-bold text-lg", colors.text)} data-testid="text-diagnosis-summary">
              {interpretation.summary}
            </p>
          </div>

          {/* Secondary Disorders */}
          {interpretation.secondaryDisorders.length > 0 && (
            <div className="p-4 rounded-lg bg-clinical-purple-light border-l-4 border-clinical-purple">
              <p className="font-bold text-clinical-purple mb-2">Secondary/Concurrent Disorders:</p>
              <ul className="space-y-1">
                {interpretation.secondaryDisorders.map((disorder, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-clinical-purple shrink-0" />
                    {disorder}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Input Values Summary */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Input Values
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {input.pH !== undefined && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">pH</p>
                  <p className={cn(
                    "text-xl font-bold font-mono",
                    input.pH < normalRanges.pH.low ? "text-clinical-red" :
                    input.pH > normalRanges.pH.high ? "text-clinical-orange" :
                    "text-clinical-green"
                  )}>
                    {input.pH.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Normal: {normalRanges.pH.low} - {normalRanges.pH.high}
                  </p>
                </div>
              )}
              {input.pCO2 !== undefined && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">pCO₂</p>
                  <p className={cn(
                    "text-xl font-bold font-mono",
                    input.pCO2 < normalRanges.pCO2.low ? "text-clinical-blue" :
                    input.pCO2 > normalRanges.pCO2.high ? "text-clinical-blue" :
                    "text-clinical-green"
                  )}>
                    {input.pCO2} mmHg
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Normal: {normalRanges.pCO2.low} - {normalRanges.pCO2.high}
                  </p>
                </div>
              )}
              {input.HCO3 !== undefined && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">HCO₃⁻</p>
                  <p className={cn(
                    "text-xl font-bold font-mono",
                    input.HCO3 < normalRanges.HCO3.low ? "text-clinical-orange" :
                    input.HCO3 > normalRanges.HCO3.high ? "text-clinical-orange" :
                    "text-clinical-green"
                  )}>
                    {input.HCO3} mmol/L
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Normal: {normalRanges.HCO3.low} - {normalRanges.HCO3.high}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Calculations Summary */}
          <Accordion type="single" collapsible className="w-full">
            {interpretation.anionGap && (
              <AccordionItem value="anion-gap">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Anion Gap Calculation
                    <Badge variant="outline" className="ml-2">
                      {interpretation.anionGap.correctedValue.toFixed(1)} mEq/L
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm pl-6">
                    <p className="font-mono">{interpretation.anionGap.formula}</p>
                    {interpretation.anionGap.correctionFormula && (
                      <p className="font-mono">{interpretation.anionGap.correctionFormula}</p>
                    )}
                    <p className={cn(
                      "font-medium",
                      interpretation.anionGap.status === "high" ? "text-clinical-red" :
                      interpretation.anionGap.status === "normal" ? "text-clinical-green" :
                      "text-clinical-purple"
                    )}>
                      Status: {interpretation.anionGap.status === "high" ? "Elevated" :
                               interpretation.anionGap.status === "normal" ? "Normal" : "Low/Negative"} Anion Gap
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {interpretation.wintersFormula && (
              <AccordionItem value="winters">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Winter's Formula
                    <Badge variant="outline" className={cn(
                      "ml-2",
                      interpretation.wintersFormula.status === "appropriate" ? "border-clinical-green text-clinical-green" :
                      "border-clinical-orange text-clinical-orange"
                    )}>
                      {interpretation.wintersFormula.status === "appropriate" ? "Appropriate" : "Abnormal"}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm pl-6">
                    <p className="font-mono">{interpretation.wintersFormula.formula}</p>
                    <p>
                      Actual pCO₂: <span className="font-mono font-medium">{interpretation.wintersFormula.actualPCO2} mmHg</span>
                    </p>
                    {interpretation.wintersFormula.status !== "appropriate" && (
                      <p className="text-clinical-orange">
                        {interpretation.wintersFormula.status === "excessive" 
                          ? "Concurrent respiratory alkalosis likely"
                          : "Concurrent respiratory acidosis likely"}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {interpretation.deltaRatio && (
              <AccordionItem value="delta-ratio">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Delta Ratio
                    <Badge variant="outline" className="ml-2">
                      {interpretation.deltaRatio.value.toFixed(2)}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm pl-6">
                    <p className="font-mono">{interpretation.deltaRatio.formula}</p>
                    <p className="font-medium">{interpretation.deltaRatio.interpretation}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {interpretation.osmolarGap && (
              <AccordionItem value="osmolar-gap">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Osmolar Gap
                    <Badge variant="outline" className={cn(
                      "ml-2",
                      interpretation.osmolarGap.isElevated ? "border-clinical-red text-clinical-red" : "border-clinical-green text-clinical-green"
                    )}>
                      {interpretation.osmolarGap.gap.toFixed(1)} mOsm/kg
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm pl-6">
                    <p className="font-mono">{interpretation.osmolarGap.formula}</p>
                    <p>
                      Measured: <span className="font-mono">{interpretation.osmolarGap.measuredOsmolality}</span> |
                      Calculated: <span className="font-mono">{interpretation.osmolarGap.calculatedOsmolality.toFixed(1)}</span>
                    </p>
                    <p className={interpretation.osmolarGap.isElevated ? "text-clinical-red font-medium" : "text-clinical-green"}>
                      {interpretation.osmolarGap.isElevated 
                        ? "Elevated - consider toxic alcohols"
                        : "Normal osmolar gap"}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Causes Card */}
      {interpretation.causes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Potential Causes
              {mnemonic && (
                <Badge variant="secondary" className="ml-2 font-normal">
                  Mnemonic: "{mnemonic}"
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 md:grid-cols-2">
              {interpretation.causes.map((cause, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={reset}
          size="lg"
          variant="outline"
          data-testid="button-new-analysis"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>
    </div>
  );
}
