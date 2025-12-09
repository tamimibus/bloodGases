import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Beaker, AlertTriangle, CheckCircle } from "lucide-react";
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
import { calculateOsmolarGap } from "@/lib/blood-gas-logic";
import { cn } from "@/lib/utils";

const osmolarGapSchema = z.object({
  measuredOsmolality: z.coerce
    .number()
    .min(200, "Measured osmolality must be at least 200 mOsm/kg")
    .max(400, "Measured osmolality must be at most 400 mOsm/kg")
    .optional(),
  glucose: z.coerce
    .number()
    .min(0, "Glucose must be at least 0 mmol/L")
    .max(50, "Glucose must be at most 50 mmol/L")
    .optional(),
  urea: z.coerce
    .number()
    .min(0, "Urea must be at least 0 mmol/L")
    .max(100, "Urea must be at most 100 mmol/L")
    .optional(),
  ethanol: z.coerce
    .number()
    .min(0, "Ethanol must be at least 0 mmol/L")
    .max(100, "Ethanol must be at most 100 mmol/L")
    .optional(),
});

type OsmolarGapFormData = z.infer<typeof osmolarGapSchema>;

export function StepOsmolarGap() {
  const { input, updateInput, goToNextStep, goToPreviousStep, interpretation } = useWizard();

  const form = useForm<OsmolarGapFormData>({
    resolver: zodResolver(osmolarGapSchema),
    defaultValues: {
      measuredOsmolality: input.measuredOsmolality ?? (undefined as unknown as number),
      glucose: input.glucose ?? (undefined as unknown as number),
      urea: input.urea ?? (undefined as unknown as number),
      ethanol: input.ethanol ?? (undefined as unknown as number),
    },
  });

  const watchedMeasuredOsm = form.watch("measuredOsmolality");
  const watchedGlucose = form.watch("glucose");
  const watchedUrea = form.watch("urea");
  const watchedEthanol = form.watch("ethanol");

  const onSubmit = (data: OsmolarGapFormData) => {
    updateInput({
      measuredOsmolality: data.measuredOsmolality,
      glucose: data.glucose,
      urea: data.urea,
      ethanol: data.ethanol,
    });
    goToNextStep();
  };

  // Calculate osmolar gap if we have required values
  const osmolarGapResult =
    watchedMeasuredOsm !== undefined &&
      input.Na !== undefined &&
      watchedGlucose !== undefined &&
      watchedUrea !== undefined
      ? calculateOsmolarGap(watchedMeasuredOsm, input.Na, watchedGlucose, watchedUrea, watchedEthanol)
      : null;

  const isHAGMA = interpretation?.anionGap?.status === "high";
  const canSkip = !isHAGMA;

  const handleSkip = () => {
    goToNextStep();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Beaker className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Step 4: Osmolar Gap (Optional)</CardTitle>
              <CardDescription>
                {isHAGMA
                  ? "Recommended for HAGMA to identify toxic alcohols (methanol, ethylene glycol)"
                  : "Optional calculation - useful for suspected toxic alcohol ingestion"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Formula Display */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-2">Calculated Osmolality Formula:</p>
                <p className="text-base font-mono font-semibold">
                  Osm = 2×[Na⁺] + Glucose + Urea (+ EtOH/4.6)
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Osmolar Gap = Measured - Calculated (Normal: -10 to +10 mOsm/kg)
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Measured Osmolality */}
                <FormField
                  control={form.control}
                  name="measuredOsmolality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Measured Osmolality (mOsm/kg)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="290"
                          className="text-lg h-11 font-mono"
                          data-testid="input-measured-osmolality"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: 280-295 mOsm/kg
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedMeasuredOsm !== undefined && (
                  <div className="pt-2">
                    <ValueRangeIndicator
                      value={watchedMeasuredOsm}
                      min={200}
                      max={400}
                      normalLow={280}
                      normalHigh={295}
                      unit=" mOsm/kg"
                      label="Measured Osmolality"
                    />
                  </div>
                )}

                {/* Glucose */}
                <FormField
                  control={form.control}
                  name="glucose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Glucose (mmol/L)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="5.0"
                          className="text-lg h-11 font-mono"
                          data-testid="input-glucose"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: 3.9-6.1 mmol/L
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedGlucose !== undefined && (
                  <div className="pt-2">
                    <ValueRangeIndicator
                      value={watchedGlucose}
                      min={0}
                      max={50}
                      normalLow={3.9}
                      normalHigh={6.1}
                      unit=" mmol/L"
                      label="Glucose"
                    />
                  </div>
                )}

                {/* Urea */}
                <FormField
                  control={form.control}
                  name="urea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Urea (mmol/L)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="5.0"
                          className="text-lg h-11 font-mono"
                          data-testid="input-urea"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: 2.5-7.1 mmol/L
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedUrea !== undefined && (
                  <div className="pt-2">
                    <ValueRangeIndicator
                      value={watchedUrea}
                      min={0}
                      max={100}
                      normalLow={2.5}
                      normalHigh={7.1}
                      unit=" mmol/L"
                      label="Urea"
                    />
                  </div>
                )}

                {/* Ethanol */}
                <FormField
                  control={form.control}
                  name="ethanol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Ethanol (mmol/L) <span className="text-muted-foreground font-normal">(if known)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          className="text-lg h-11 font-mono"
                          data-testid="input-ethanol"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Include if ethanol level measured
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedEthanol !== undefined && watchedEthanol > 0 && (
                  <div className="pt-2">
                    <ValueRangeIndicator
                      value={watchedEthanol}
                      min={0}
                      max={100}
                      normalLow={0}
                      normalHigh={0}
                      unit=" mmol/L"
                      label="Ethanol"
                    />
                  </div>
                )}
              </div>

              {/* Calculation Result */}
              {osmolarGapResult && (
                <div className="space-y-4">
                  {/* Calculation Display */}
                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm text-muted-foreground mb-1">Calculation:</p>
                    <p className="font-mono text-sm">{osmolarGapResult.formula}</p>
                  </div>

                  {/* Result Display */}
                  <div className="flex items-center justify-center gap-8 p-6 rounded-lg bg-muted/30">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Calculated</p>
                      <p className="text-2xl font-bold font-mono">
                        {osmolarGapResult.calculatedOsmolality.toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">mOsm/kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Measured</p>
                      <p className="text-2xl font-bold font-mono">
                        {osmolarGapResult.measuredOsmolality}
                      </p>
                      <p className="text-sm text-muted-foreground">mOsm/kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Osmolar Gap</p>
                      <p className={cn(
                        "text-3xl font-bold font-mono",
                        osmolarGapResult.isElevated ? "text-clinical-red" : "text-clinical-green"
                      )}>
                        {osmolarGapResult.gap.toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">mOsm/kg</p>
                    </div>
                  </div>

                  {/* Interpretation */}
                  {/* <div
                    className={cn(
                      "p-4 rounded-lg border-l-4 flex items-start gap-3",
                      osmolarGapResult.isElevated
                        ? "bg-clinical-red-light border-clinical-red"
                        : "bg-clinical-green-light border-clinical-green"
                    )}
                    data-testid="osmolar-gap-interpretation"
                  >
                    {osmolarGapResult.isElevated ? (
                      <AlertTriangle className="w-5 h-5 text-clinical-red shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-clinical-green shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={cn(
                        "font-bold text-lg",
                        osmolarGapResult.isElevated ? "text-clinical-red" : "text-clinical-green"
                      )}>
                        {osmolarGapResult.isElevated ? "Elevated Osmolar Gap" : "Normal Osmolar Gap"}
                      </p>
                      <p className="text-sm text-foreground/80 mt-1">
                        {osmolarGapResult.isElevated
                          ? "Elevated osmolar gap suggests presence of unmeasured osmoles. Consider toxic alcohols (methanol, ethylene glycol, isopropanol), mannitol, or glycerol."
                          : "Normal osmolar gap. Toxic alcohol ingestion is less likely, but cannot be completely excluded in early or late presentations."}
                      </p>
                    </div>
                  </div> */}
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
                <div className="flex gap-3">
                  {canSkip && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={handleSkip}
                      data-testid="button-skip"
                    >
                      Skip
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    data-testid="button-next-step"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
