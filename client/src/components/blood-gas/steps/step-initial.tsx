import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Beaker, Wind, FlaskConical } from "lucide-react";
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
import { ValueRangeIndicator } from "../value-range-indicator";
import { useWizard } from "../wizard-context";
import { normalRanges } from "@shared/schema";
import { determinePrimaryDisorder, formatDisorderName } from "@/lib/blood-gas-logic";
import { cn } from "@/lib/utils";

const initialSchema = z.object({
  pH: z.coerce
    .number()
    .min(6.8, "pH must be at least 6.8")
    .max(7.8, "pH must be at most 7.8"),
  pCO2: z.coerce
    .number()
    .min(10, "pCO2 must be at least 10 mmHg")
    .max(100, "pCO2 must be at most 100 mmHg"),
  HCO3: z.coerce
    .number()
    .min(5, "HCO3 must be at least 5 mmol/L")
    .max(45, "HCO3 must be at most 45 mmol/L"),
});

type InitialFormData = z.infer<typeof initialSchema>;

export function StepInitial() {
  const { input, updateInput, goToNextStep } = useWizard();

  const form = useForm<InitialFormData>({
    resolver: zodResolver(initialSchema),
    defaultValues: {
      pH: input.pH ?? (undefined as unknown as number),
      pCO2: input.pCO2 ?? (undefined as unknown as number),
      HCO3: input.HCO3 ?? (undefined as unknown as number),
    },
  });

  const watchedPH = form.watch("pH");
  const watchedPCO2 = form.watch("pCO2");
  const watchedHCO3 = form.watch("HCO3");

  const onSubmit = (data: InitialFormData) => {
    updateInput({ pH: data.pH, pCO2: data.pCO2, HCO3: data.HCO3 });
    goToNextStep();
  };

  const getpHInterpretation = (ph: number | undefined) => {
    if (ph === undefined) return null;
    if (ph < 7.35) {
      return {
        status: "Acidaemia",
        description: "pH is below normal range",
        color: "text-clinical-red",
        bgColor: "bg-clinical-red-light",
        borderColor: "border-clinical-red",
      };
    }
    if (ph > 7.45) {
      return {
        status: "Alkalaemia",
        description: "pH is above normal range",
        color: "text-clinical-orange",
        bgColor: "bg-clinical-orange-light",
        borderColor: "border-clinical-orange",
      };
    }
    return {
      status: "Normal",
      description: "pH is within normal range",
      color: "text-clinical-green",
      bgColor: "bg-clinical-green-light",
      borderColor: "border-clinical-green",
    };
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

  const phInterpretation = getpHInterpretation(watchedPH);
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
              <FormField
                control={form.control}
                name="pH"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Arterial pH</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="7.40"
                        className="text-2xl h-14 font-mono"
                        data-testid="input-ph"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Normal range: {normalRanges.pH.low} - {normalRanges.pH.high}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Visual Range Indicator for pH */}
              {watchedPH !== undefined && (
                <div className="pt-2">
                  <ValueRangeIndicator
                    value={watchedPH}
                    min={6.8}
                    max={7.8}
                    normalLow={normalRanges.pH.low}
                    normalHigh={normalRanges.pH.high}
                    unit=""
                    label="pH"
                  />
                </div>
              )}

              {/* pH Interpretation */}
              {phInterpretation && (
                <div
                  className={`p-4 rounded-lg border-l-4 ${phInterpretation.bgColor} ${phInterpretation.borderColor}`}
                  data-testid="ph-interpretation"
                >
                  <p className={`font-bold text-lg ${phInterpretation.color}`}>
                    {phInterpretation.status}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1">
                    {phInterpretation.description}
                  </p>
                </div>
              )}

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
                              step="0.1"
                              placeholder="40"
                              className="text-xl h-12 font-mono"
                              data-testid="input-pco2"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Normal: {normalRanges.pCO2.low} - {normalRanges.pCO2.high} {normalRanges.pCO2.unit}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedPCO2 !== undefined && (
                      <ValueRangeIndicator
                        value={watchedPCO2}
                        min={10}
                        max={100}
                        normalLow={normalRanges.pCO2.low}
                        normalHigh={normalRanges.pCO2.high}
                        unit=" mmHg"
                        label="pCO₂"
                      />
                    )}
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
                              step="0.1"
                              placeholder="24"
                              className="text-xl h-12 font-mono"
                              data-testid="input-hco3"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Normal: {normalRanges.HCO3.low} - {normalRanges.HCO3.high} {normalRanges.HCO3.unit}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedHCO3 !== undefined && (
                      <ValueRangeIndicator
                        value={watchedHCO3}
                        min={5}
                        max={45}
                        normalLow={normalRanges.HCO3.low}
                        normalHigh={normalRanges.HCO3.high}
                        unit=" mmol/L"
                        label="HCO₃⁻"
                      />
                    )}
                  </div>
                </div>
              </div>

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
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={!isComplete}
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
