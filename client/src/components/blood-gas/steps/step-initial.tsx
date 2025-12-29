import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Beaker, Wind, FlaskConical, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ValueRangeIndicator } from "../value-range-indicator";
import { useWizard } from "../wizard-context";
import { normalRanges } from "@shared/schema";
import { interpretBloodGas, validateHendersonHasselbalch } from "@/lib/blood-gas-logic";
import { cn } from "@/lib/utils";

const initialSchema = z.object({
  pH: z.coerce.number().optional(),
  pCO2: z.coerce.number().optional(),
  HCO3: z.coerce.number().optional(),
});

type InitialFormData = z.infer<typeof initialSchema>;

export function StepInitial() {
  const { input, updateInput, goToNextStep, setCurrentStep } = useWizard();

  const form = useForm<InitialFormData>({
    resolver: zodResolver(initialSchema),
    defaultValues: {
      pH: input.pH ?? (undefined as unknown as number),
      pCO2: input.pCO2 ?? (undefined as unknown as number),
      HCO3: input.HCO3 ?? (undefined as unknown as number),
    },
  });

  // Auto-save changes to global state
  const values = form.watch();

  useEffect(() => {
    const handler = setTimeout(() => {
      updateInput(values);
    }, 500);

    return () => clearTimeout(handler);
  }, [JSON.stringify(values), updateInput]);

  // Ensure values are saved on unmount
  useEffect(() => {
    return () => {
      const currentValues = form.getValues();
      if (currentValues) {
        updateInput(currentValues);
      }
    };
  }, [updateInput, form]);

  const rawPH = form.watch("pH");
  const rawPCO2 = form.watch("pCO2");
  const rawHCO3 = form.watch("HCO3");

  const parseValue = (val: any): number | undefined => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  const watchedPH = parseValue(rawPH);
  const watchedPCO2 = parseValue(rawPCO2);
  const watchedHCO3 = parseValue(rawHCO3);

  const getWarningText = (val: number | undefined, min: number, max: number, label: string) => {
    if (val === undefined) return null;
    if (val < min || val > max) {
      return (
        <div className="flex items-center gap-2 text-amber-600 font-medium text-sm mt-1 bg-amber-50 p-2 rounded border border-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{label} value is unusual. Please double check.</span>
        </div>
      );
    }
    return null;
  };

  const onSubmit = (data: InitialFormData) => {
    updateInput({ pH: data.pH, pCO2: data.pCO2, HCO3: data.HCO3 });

    if (data.pH !== undefined && data.pCO2 !== undefined && data.HCO3 !== undefined) {
      const interpretation = interpretBloodGas({ pH: data.pH, pCO2: data.pCO2, HCO3: data.HCO3 });
      const disorder = interpretation?.primaryDisorder;
      const isNormalPH = data.pH >= 7.35 && data.pH <= 7.45;

      if (disorder === "metabolic_acidosis" || isNormalPH) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }
    } else {
      goToNextStep();
    }
  };

  const interpretation =
    watchedPH !== undefined && watchedPCO2 !== undefined && watchedHCO3 !== undefined
      ? interpretBloodGas({ pH: watchedPH, pCO2: watchedPCO2, HCO3: watchedHCO3 })
      : null;

  const preliminaryDisorder = interpretation?.primaryDisorder ?? null;

  const getDisorderInfo = (disorder: string | null) => {
    if (!disorder) return null;

    const disorders: Record<string, { description: string; color: string; bgColor: string; borderColor: string }> = {
      respiratory_acidosis: {
        description: "High pCO2 with low pH indicates respiratory acidosis",
        color: "text-clinical-blue",
        bgColor: "bg-clinical-blue-light",
        borderColor: "border-clinical-blue",
      },
      metabolic_acidosis: {
        description: "Low HCO3 with low pH indicates metabolic acidosis",
        color: "text-clinical-orange",
        bgColor: "bg-clinical-orange-light",
        borderColor: "border-clinical-orange",
      },
      respiratory_alkalosis: {
        description: "Low pCO2 with high pH indicates respiratory alkalosis",
        color: "text-clinical-blue",
        bgColor: "bg-clinical-blue-light",
        borderColor: "border-clinical-blue",
      },
      metabolic_alkalosis: {
        description: "High HCO3 with high pH indicates metabolic alkalosis",
        color: "text-clinical-green",
        bgColor: "bg-clinical-green-light",
        borderColor: "border-clinical-green",
      },
      normal: {
        description: "Values are within normal range",
        color: "text-clinical-green",
        bgColor: "bg-clinical-green-light",
        borderColor: "border-clinical-green",
      },
    };

    return disorders[disorder];
  };

  const disorderInfo = getDisorderInfo(preliminaryDisorder);
  const isComplete = watchedPH !== undefined && watchedPCO2 !== undefined && watchedHCO3 !== undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Beaker className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Step 1: Initial Blood Gas Values</CardTitle>
              <CardDescription>
                Enter the arterial blood gas values to begin interpretation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* pH Input */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="pH"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xl font-bold flex items-center gap-2">
                        <Beaker className="w-5 h-5 text-clinical-blue" />
                        pH
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="7.40"
                          className="text-2xl h-14 font-mono"
                          data-testid="input-ph"
                          {...field}
                          onChange={field.onChange}
                          value={field.value ?? ""}
                          tooltip={`Expected range: 6.8 - 7.8`}
                        />
                      </FormControl>

                      {getWarningText(watchedPH, 6.8, 7.8, "pH")}

                      {watchedPH !== undefined && (
                        <div className="pt-2">
                          <ValueRangeIndicator
                            value={watchedPH}
                            min={0}
                            max={14}
                            normalLow={normalRanges.pH.low}
                            normalHigh={normalRanges.pH.high}
                            unit=""
                            label="pH"
                          />
                        </div>
                      )}

                      <FormDescription>
                        Normal range: {normalRanges.pH.low} - {normalRanges.pH.high}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gases Section */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Blood Gas Parameters</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* pCO2 Input */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pCO2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center gap-2">
                            <Wind className="w-4 h-4 text-clinical-blue" />
                            pCO₂ (mmHg)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="40"
                              className="text-xl h-12 font-mono"
                              data-testid="input-pco2"
                              {...field}
                              tooltip={`Expected range: 10 - 100`}
                              onChange={field.onChange}
                              value={field.value ?? ""}
                            />
                          </FormControl>

                          {getWarningText(watchedPCO2, 10, 100, "pCO₂")}

                          {watchedPCO2 !== undefined && (
                            <div className="pt-2">
                              <ValueRangeIndicator
                                value={watchedPCO2}
                                min={10}
                                max={100}
                                normalLow={normalRanges.pCO2.low}
                                normalHigh={normalRanges.pCO2.high}
                                unit=" mmHg"
                                label="pCO₂"
                              />
                            </div>
                          )}

                          <FormDescription>
                            Normal: {normalRanges.pCO2.low} - {normalRanges.pCO2.high} {normalRanges.pCO2.unit}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* HCO3 Input */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="HCO3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-clinical-orange" />
                            HCO₃⁻ (mmol/L)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="24"
                              className="text-xl h-12 font-mono"
                              data-testid="input-hco3"
                              {...field}
                              tooltip={`Expected range: 5 - 45`}
                              onChange={field.onChange}
                              value={field.value ?? ""}
                            />
                          </FormControl>

                          {getWarningText(watchedHCO3, 5, 45, "HCO₃⁻")}

                          {watchedHCO3 !== undefined && (
                            <div className="pt-2">
                              <ValueRangeIndicator
                                value={watchedHCO3}
                                min={5}
                                max={45}
                                normalLow={normalRanges.HCO3.low}
                                normalHigh={normalRanges.HCO3.high}
                                unit=" mmol/L"
                                label="HCO₃⁻"
                              />
                            </div>
                          )}

                          <FormDescription>
                            {/* HC03 “the measured Bicarbonate, please obtain the result from the chemistry” */}
                            Normal: {normalRanges.HCO3.low} - {normalRanges.HCO3.high} {normalRanges.HCO3.unit}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Henderson-Hasselbalch Validation Warning */}
              {isComplete && (
                (() => {
                  const validation = validateHendersonHasselbalch(watchedPH, watchedPCO2, watchedHCO3);
                  if (!validation.isValid) {
                    return (
                      <Alert variant="destructive" className="mt-4 border-l-4 border-l-destructive font-bold">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle>Check for lab error</AlertTitle>
                        <AlertDescription>
                          The calculated pH ({validation.calculatedPH.toFixed(2)}) differs significantly from the entered pH ({watchedPH}) . Please consider a lab error.
                        </AlertDescription>
                      </Alert>
                    );
                  }
                  return null;
                })()
              )}

              {/* Preliminary Disorder Display */}
              {preliminaryDisorder && disorderInfo && (
                <div
                  className={cn(
                    "p-4 rounded-lg border-l-4",
                    disorderInfo.bgColor,
                    disorderInfo.borderColor
                  )}
                  data-testid="disorder-interpretation"
                >
                  <p className={cn("font-bold text-lg", disorderInfo.color)}>
                    {interpretation?.summary}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1">
                    {disorderInfo.description}
                  </p>

                  {/* Compensation / Secondary Process */}
                  {(() => {
                    if (!preliminaryDisorder || preliminaryDisorder === "normal" || !isComplete) return null;

                    let compensationResult = null;
                    let title = "Expected Compensation";

                    if (preliminaryDisorder === "metabolic_acidosis") {
                      compensationResult = interpretation?.wintersFormula ?? null;
                      title = "Winter's Formula (Expected pCO₂)";
                    } else if (preliminaryDisorder === "metabolic_alkalosis") {
                      compensationResult = interpretation?.compensation ?? null;
                      title = "Expected pCO₂";
                    } else if (preliminaryDisorder === "respiratory_acidosis" || preliminaryDisorder === "respiratory_alkalosis") {
                      compensationResult = interpretation?.compensation ?? null;
                      title = "Expected HCO₃⁻";
                    }

                    if (!compensationResult) return null;

                    const statusColor =
                      compensationResult.status === "appropriate" ? "text-clinical-green" :
                        compensationResult.status === "excessive" ? "text-clinical-orange" :
                          "text-clinical-red";

                    return (
                      <div className="mt-4 pt-3 border-t border-black/10">
                        <p className="font-semibold text-sm mb-1">{title}</p>
                        {"expectedPCO2Low" in compensationResult ? (
                          <p className="font-mono text-sm">
                            Expected: {compensationResult.expectedPCO2Low.toFixed(1)} - {compensationResult.expectedPCO2High.toFixed(1)} mmHg
                          </p>
                        ) : (
                          <p className="font-mono text-sm">
                            {(compensationResult as any).rule}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span>Status:</span>
                          <span className={cn("font-bold", statusColor)}>
                            {compensationResult.status === "appropriate" ? "Compensated" :
                              compensationResult.status === "excessive" ? "Partially Compensated / Mixed" :
                                "Uncompensated / Mixed"}
                            <span className="font-normal text-muted-foreground ml-1">
                              ({compensationResult.status})
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  size="lg"
                  data-testid="button-next-step"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
