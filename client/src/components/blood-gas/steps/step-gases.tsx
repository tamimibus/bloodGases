import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Wind, FlaskConical } from "lucide-react";
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

const gasesSchema = z.object({
  pCO2: z.coerce
    .number()
    .min(10, "pCO2 must be at least 10 mmHg")
    .max(100, "pCO2 must be at most 100 mmHg"),
  HCO3: z.coerce
    .number()
    .min(5, "HCO3 must be at least 5 mmol/L")
    .max(45, "HCO3 must be at most 45 mmol/L"),
});

type GasesFormData = z.infer<typeof gasesSchema>;

export function StepGases() {
  const { input, updateInput, goToNextStep, goToPreviousStep } = useWizard();

  const form = useForm<GasesFormData>({
    resolver: zodResolver(gasesSchema),
    defaultValues: {
      pCO2: input.pCO2 ?? (undefined as unknown as number),
      HCO3: input.HCO3 ?? (undefined as unknown as number),
    },
  });

  const parseValue = (val: any): number | undefined => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  const watchedPCO2 = parseValue(form.watch("pCO2"));
  const watchedHCO3 = parseValue(form.watch("HCO3"));

  const onSubmit = (data: GasesFormData) => {
    const pCO2Val = parseValue(data.pCO2);
    const HCO3Val = parseValue(data.HCO3);

    if (pCO2Val !== undefined && HCO3Val !== undefined) {
      updateInput({ pCO2: pCO2Val, HCO3: HCO3Val });
      goToNextStep();
    }
  };

  // Calculate preliminary disorder if we have all values
  const preliminaryDisorder =
    input.pH !== undefined && watchedPCO2 !== undefined && watchedHCO3 !== undefined
      ? determinePrimaryDisorder(input.pH, watchedPCO2, watchedHCO3)
      : null;

  const getDisorderInfo = (disorder: string | null) => {
    if (!disorder) return null;

    const disorders: Record<string, { description: string; color: string; bgColor: string; borderColor: string }> = {
      respiratory_acidosis: {
        description: "High pCO2 with low pH indicates respiratory acidosis. The lungs are not eliminating enough CO2.",
        color: "text-clinical-blue",
        bgColor: "bg-clinical-blue-light",
        borderColor: "border-clinical-blue",
      },
      metabolic_acidosis: {
        description: "Low HCO3 with low pH indicates metabolic acidosis. Next step: Calculate the anion gap.",
        color: "text-clinical-orange",
        bgColor: "bg-clinical-orange-light",
        borderColor: "border-clinical-orange",
      },
      respiratory_alkalosis: {
        description: "Low pCO2 with high pH indicates respiratory alkalosis. The lungs are eliminating too much CO2.",
        color: "text-clinical-blue",
        bgColor: "bg-clinical-blue-light",
        borderColor: "border-clinical-blue",
      },
      metabolic_alkalosis: {
        description: "High HCO3 with high pH indicates metabolic alkalosis. There is excess bicarbonate in the blood.",
        color: "text-clinical-green",
        bgColor: "bg-clinical-green-light",
        borderColor: "border-clinical-green",
      },
      normal: {
        description: "Values are within normal range. The acid-base status appears balanced.",
        color: "text-clinical-green",
        bgColor: "bg-clinical-green-light",
        borderColor: "border-clinical-green",
      },
    };

    return disorders[disorder];
  };

  const disorderInfo = getDisorderInfo(preliminaryDisorder);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wind className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Step 2: pCO₂ & HCO₃⁻ Analysis</CardTitle>
              <CardDescription>
                Enter the pCO2 and bicarbonate values to determine the primary disorder
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            onChange={field.onChange}
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
                            onChange={field.onChange}
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
              </div>

              {/* Preliminary Disorder Display */}
              {/* {preliminaryDisorder && disorderInfo && (
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
              )} */}

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
                  type="submit"
                  size="lg"
                  disabled={!watchedPCO2 || !watchedHCO3}
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

      {/* Educational Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Respiratory vs Metabolic Disorders</h3>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-clinical-blue mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium">Respiratory Disorders</p>
                  <p className="text-muted-foreground">
                    Primary change in pCO₂. High pCO₂ (hypoventilation) = acidosis.
                    Low pCO₂ (hyperventilation) = alkalosis.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-clinical-orange mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium">Metabolic Disorders</p>
                  <p className="text-muted-foreground">
                    Primary change in HCO₃⁻. Low HCO₃⁻ = acidosis.
                    High HCO₃⁻ = alkalosis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
