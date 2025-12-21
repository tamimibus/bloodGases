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
import { determinePrimaryDisorder, formatDisorderName, validateHendersonHasselbalch, calculateWintersFormula, calculateMetabolicAlkalosisCompensation, calculateRespiratoryCompensation } from "@/lib/blood-gas-logic";
import { cn } from "@/lib/utils";
import { SidebarMenuButton } from "@/components/ui/sidebar";

const initialSchema = z.object({
  pH: z.coerce
    .number()
    .min(6.8, "Please enter a pH value between 6.8 and 7.8")
    .max(7.8, "Please enter a pH value between 6.8 and 7.8")
    .optional(),
  pCO2: z.coerce
    .number()
    .min(10, "Please enter a pCO2 value between 10 and 100 mmHg")
    .max(100, "Please enter a pCO2 value between 10 and 100 mmHg")
    .optional(),
  HCO3: z.coerce
    .number()
    .min(5, "Please enter a HCO3 value between 5 and 45 mmol/L")
    .max(45, "Please enter a HCO3 value between 5 and 45 mmol/L")
    .optional(),
});

type InitialFormData = z.infer<typeof initialSchema>;

export function StepInitial() {

  // ... existing imports

  // ... inside StepInitial component
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
  // This ensures values are persisted even if the user navigates without clicking Next
  const values = form.watch();

  useEffect(() => {
    const handler = setTimeout(() => {
      updateInput(values);
    }, 500);

    return () => clearTimeout(handler);
  }, [JSON.stringify(values), updateInput]);

  // Ensure values are saved on unmount (preventing data loss if navigating while debounce is pending)
  useEffect(() => {
    return () => {
      const currentValues = form.getValues();
      // Only update if we have values to avoid clearing state on accidental unmounts if any
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

  const onSubmit = (data: InitialFormData) => {
    updateInput({ pH: data.pH, pCO2: data.pCO2, HCO3: data.HCO3 });

    // Check if we should skip Anion Gap step (Step 2)
    // Only go to AG step if Metabolic Acidosis or Normal pH
    if (data.pH !== undefined && data.pCO2 !== undefined && data.HCO3 !== undefined) {
      const disorder = determinePrimaryDisorder(data.pH, data.pCO2, data.HCO3);
      const isNormalPH = data.pH >= 7.35 && data.pH <= 7.45;

      if (disorder === "metabolic_acidosis" || isNormalPH) {
        setCurrentStep(2);
      } else {
        // Skip Anion Gap step -> Go to Osmolar Gap (Step 3)
        setCurrentStep(3);
      }
    } else {
      goToNextStep();
    }
  };



  const preliminaryDisorder =
    watchedPH !== undefined && watchedPCO2 !== undefined && watchedHCO3 !== undefined
      ? determinePrimaryDisorder(watchedPH, watchedPCO2, watchedHCO3)
      : null;

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
      {/* <SidebarMenuButton /> */}
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
              <FormField
                control={form.control}
                name="pH"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Arterial pH</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="7.40"
                        className="text-2xl h-14 font-mono"
                        data-testid="input-ph"
                        {...field}
                        onChange={field.onChange}
                        value={field.value ?? ""}
                        tooltip=" Good —  is within the 6.8 - 7.8 "
                        onMouseEnter={(e) => {
                          const val = parseValue(field.value);
                          if (val !== undefined && (val < 6.8 || val > 7.8)) {
                            e.currentTarget.title = `Value must be between ${6.8} and ${7.8}`;
                          } else {
                            e.currentTarget.title = "";
                          }
                        }}


                      />
                    </FormControl>

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

              {/* pH Interpretation */}


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
                              tooltip=" Good —  is within the 10 - 100"
                              onChange={field.onChange}
                              value={field.value ?? ""}
                            />
                          </FormControl>

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
                              tooltip=" Good —  is within the 10- 42"
                              onChange={field.onChange}
                              value={field.value ?? ""}
                            />
                          </FormControl>

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

                          <FormMessage />
                          <FormDescription>
                            HC03 “the measured Bicarbonate, please obtain the result from the chemistry”
                            Normal: {normalRanges.HCO3.low} - {normalRanges.HCO3.high} {normalRanges.HCO3.unit}
                          </FormDescription>
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
                      <Alert variant="destructive" className="mt-4 border-l-4 border-l-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle className="font-bold ml-2">Check for lab error</AlertTitle>
                        <AlertDescription className="ml-2">
                          The calculated pH ({validation.calculatedPH.toFixed(2)}) differs from the entered pH ({watchedPH}) by more than 0.03. Please verify the values.
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
                    Primary Disorder: {formatDisorderName(preliminaryDisorder)}
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
                      compensationResult = calculateWintersFormula(watchedHCO3, watchedPCO2);
                      title = "Winter's Formula (Expected pCO₂)";
                    } else if (preliminaryDisorder === "metabolic_alkalosis") {
                      compensationResult = calculateMetabolicAlkalosisCompensation(watchedHCO3, watchedPCO2);
                      title = "Expected pCO₂";
                    } else if (preliminaryDisorder === "respiratory_acidosis" || preliminaryDisorder === "respiratory_alkalosis") {
                      compensationResult = calculateRespiratoryCompensation(preliminaryDisorder, watchedPCO2, watchedHCO3);
                      title = "Expected HCO₃⁻";
                    }

                    if (!compensationResult) return null;

                    // Determine status color
                    const statusColor =
                      compensationResult.status === "appropriate" ? "text-clinical-green" :
                        compensationResult.status === "excessive" ? "text-clinical-orange" :
                          "text-clinical-red"; // Inadequate

                    return (
                      <div className="mt-4 pt-3 border-t border-black/10">
                        <p className="font-semibold text-sm mb-1">{title}</p>

                        {/* Formula/Expected Range */}
                        {"expectedPCO2Low" in compensationResult ? (
                          <p className="font-mono text-sm">
                            Expected: {compensationResult.expectedPCO2Low.toFixed(1)} - {compensationResult.expectedPCO2High.toFixed(1)} mmHg
                          </p>
                        ) : (
                          <p className="font-mono text-sm">
                            {compensationResult.rule}
                          </p>
                        )}

                        {/* Actual Value Comparison */}
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
