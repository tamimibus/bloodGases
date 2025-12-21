import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Calculator, Atom } from "lucide-react";
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
import { normalRanges, metabolicAcidosisCauses } from "@shared/schema";
import { calculateAnionGap } from "@/lib/blood-gas-logic";
import { cn } from "@/lib/utils";

const anionGapSchema = z.object({
  Na: z.coerce
    .number()
    .min(100, "Please enter a sodium (Na) value between 100 and 180 mmol/L")
    .max(180, "Please enter a sodium (Na) value between 100 and 180 mmol/L")
    .optional(),
  Cl: z.coerce
    .number()
    .min(70, "Please enter a chloride (Cl) value between 70 and 130 mmol/L")
    .max(130, "Please enter a chloride (Cl) value between 70 and 130 mmol/L")
    .optional(),
  potassium: z.coerce
    .number()
    .min(0, "Please enter a potassium (K) value between 0 and 10 mmol/L")
    .max(10, "Please enter a potassium (K) value between 0 and 10 mmol/L")
    .optional(),
  albumin: z.coerce
    .number()
    .min(1, "Please enter an albumin value between 1 and 6 g/dL")
    .max(6, "Please enter an albumin value between 1 and 6 g/dL")
    .optional(),
});

type AnionGapFormData = z.infer<typeof anionGapSchema>;

export function StepAnionGap() {
  const { input, updateInput, goToNextStep, goToPreviousStep, interpretation } = useWizard();

  const form = useForm<AnionGapFormData>({
    resolver: zodResolver(anionGapSchema),
    defaultValues: {
      Na: input.Na ?? (undefined as unknown as number),
      Cl: input.Cl ?? (undefined as unknown as number),
      potassium: input.potassium ?? (undefined as unknown as number),
      albumin: input.albumin ?? (undefined as unknown as number),
    },
  });

  // Auto-save changes to global state
  const values = form.watch();

  const parseValue = (val: any): number | undefined => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const parsedValues = {
        Na: parseValue(values.Na),
        Cl: parseValue(values.Cl),
        potassium: parseValue(values.potassium),
        albumin: parseValue(values.albumin),
      };
      updateInput(parsedValues);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [updateInput, values]);

  // Ensure values are saved on unmount
  useEffect(() => {
    return () => {
      updateInput(form.getValues());
    };
  }, [updateInput, form]);

  const watchedNa = parseValue(form.watch("Na"));
  const watchedCl = parseValue(form.watch("Cl"));
  const watchedPotassium = parseValue(form.watch("potassium"));
  const watchedAlbumin = parseValue(form.watch("albumin"));

  const onSubmit = (data: AnionGapFormData) => {
    updateInput({ Na: data.Na, Cl: data.Cl, potassium: data.potassium, albumin: data.albumin });
    goToNextStep();
  };

  const getpHStatus = (ph: number) => {
    if (ph < 7.35) return "acidaemia";
    if (ph > 7.45) return "alkalaemia";
    return "normal";
  };

  const isMetabolicAcidosis = interpretation?.primaryDisorder === "metabolic_acidosis";
  const isNormalPH = input.pH !== undefined && getpHStatus(input.pH) === "normal";
  const shouldCalculateAG = isMetabolicAcidosis || isNormalPH;

  const inputHCO3 = parseValue(input.HCO3);

  // Calculate anion gap if we have required values and conditions are met
  const anionGapResult =
    shouldCalculateAG &&
      watchedNa !== undefined && watchedCl !== undefined && inputHCO3 !== undefined
      ? calculateAnionGap(watchedNa, watchedCl, inputHCO3, watchedAlbumin)
      : null;

  const getWarning = (val: number | undefined, min: number, max: number) => {
    if (val !== undefined && (val < min || val > max)) {
      return "value is too high / too low , please double check your input";
    }
    return undefined;
  };

  const getAGStatusInfo = (status: string | undefined) => {
    if (!status) return null;

    const statuses: Record<string, { label: string; description: string; color: string; bgColor: string; borderColor: string; mnemonic?: string; causes: string[] }> = {
      normal: {
        label: "Normal Anion Gap Metabolic Acidosis (NAGMA)",
        description: "The anion gap is within normal range. This suggests a hyperchloraemic metabolic acidosis.",
        color: "text-clinical-green",
        bgColor: "bg-clinical-green-light",
        borderColor: "border-clinical-green",
        mnemonic: metabolicAcidosisCauses.normalAGMA.mnemonic,
        causes: metabolicAcidosisCauses.normalAGMA.causes,
      },
      high: {
        label: "High Anion Gap Metabolic Acidosis (HAGMA)",
        description: "The anion gap is elevated. This suggests the presence of unmeasured anions such as lactate, ketones, or toxins.",
        color: "text-clinical-red",
        bgColor: "bg-clinical-red-light",
        borderColor: "border-clinical-red",
        mnemonic: metabolicAcidosisCauses.highAGMA.mnemonic,
        causes: metabolicAcidosisCauses.highAGMA.causes,
      },
      low_negative: {
        label: "Low/Negative Anion Gap",
        description: "The anion gap is unusually low or negative. This may indicate laboratory error or unmeasured cations.",
        color: "text-clinical-purple",
        bgColor: "bg-clinical-purple-light",
        borderColor: "border-clinical-purple",
        causes: metabolicAcidosisCauses.lowNegativeAGMA,
      },
    };

    return statuses[status];
  };

  const agStatusInfo = getAGStatusInfo(anionGapResult?.status);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Step 2: Anion Gap Calculation</CardTitle>
              <CardDescription>
                {shouldCalculateAG
                  ? "Calculate the anion gap to classify the metabolic acidosis or verify normal gap"
                  : "Anion Gap calculation is not indicated for this acid-base disorder"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Formula Display */}
              {shouldCalculateAG ? (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground mb-2">Anion Gap Formula:</p>
                  <p className="text-lg font-mono font-semibold">
                    AG = [Na⁺] - ([Cl⁻] + [HCO₃⁻])
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Normal = {normalRanges.anionGap.normal} (±4) mEq/L
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/50 border border-l-4 border-l-clinical-gray">
                  <p className="text-sm text-muted-foreground">
                    Anion Gap calculation is typically reserved for cases of Metabolic Acidosis or when checking for a hidden Anion Gap in normal pH.
                  </p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-3">
                {/* Na Input */}
                <FormField
                  control={form.control}
                  name="Na"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <Atom className="w-4 h-4" />
                        Na⁺ (mmol/L)
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="Na"
                          type="number"
                          placeholder="135-145"
                          className="text-lg h-11 font-mono"
                          data-testid="input-na"
                          {...field}
                          onChange={field.onChange}
                          value={field.value ?? ""}
                          tooltip={getWarning(parseValue(field.value), 100, 155)}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: {normalRanges.Na.low}-{normalRanges.Na.high}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedNa !== undefined && (
                  <div className="pt-2">
                    <ValueRangeIndicator
                      value={watchedNa}
                      min={100}
                      max={180}
                      normalLow={normalRanges.Na.low}
                      normalHigh={normalRanges.Na.high}
                      unit=" mmol/L"
                      label="Na⁺"
                    />
                  </div>
                )}

                {/* Cl Input */}
                <FormField
                  control={form.control}
                  name="Cl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <Atom className="w-4 h-4" />
                        Cl⁻ (mmol/L)
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="Cl"
                          type="number"
                          placeholder="98-107"
                          className="text-lg h-11 font-mono"
                          data-testid="input-cl"
                          {...field}
                          onChange={field.onChange}
                          value={field.value ?? ""}
                          tooltip={getWarning(parseValue(field.value), 90, 120)}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: {normalRanges.Cl.low}-{normalRanges.Cl.high}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedCl !== undefined && (
                  <div className="pt-2">
                    <ValueRangeIndicator
                      value={watchedCl}
                      min={70}
                      max={130}
                      normalLow={normalRanges.Cl.low}
                      normalHigh={normalRanges.Cl.high}
                      unit=" mmol/L"
                      label="Cl⁻"
                    />
                  </div>
                )}

                {/* Potassium Input */}
                <FormField
                  control={form.control}
                  name="potassium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <Atom className="w-4 h-4" />
                        K⁺ (mmol/L) <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="4.0"
                          className="text-lg h-11 font-mono"
                          data-testid="input-k"
                          {...field}
                          onChange={field.onChange}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: {normalRanges.K.low}-{normalRanges.K.high}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedPotassium !== undefined && (
                  <div className="pt-2">
                    <ValueRangeIndicator
                      value={watchedPotassium}
                      min={1}
                      max={10}
                      normalLow={normalRanges.K.low}
                      normalHigh={normalRanges.K.high}
                      unit=" mmol/L"
                      label="K⁺"
                    />
                  </div>
                )}

                {/* Albumin Input (Optional) */}
                <FormField
                  control={form.control}
                  name="albumin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Albumin (g/dL) <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="4.0"
                          className="text-lg h-11 font-mono"
                          data-testid="input-albumin"
                          {...field}
                          onChange={field.onChange}
                          value={field.value ?? ""}
                          tooltip={getWarning(parseValue(field.value), 2, 6)}
                        />
                      </FormControl>
                      <FormDescription>
                        For albumin correction
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedAlbumin !== undefined && (
                  <div className="pt-2">
                    <ValueRangeIndicator
                      value={watchedAlbumin}
                      min={1}
                      max={6}
                      normalLow={3.5}
                      normalHigh={5.0}
                      unit=" g/dL"
                      label="Albumin"
                    />
                  </div>
                )}
              </div>

              {/* Calculation Result */}
              {anionGapResult && (
                <div className="space-y-4">
                  {/* Calculation Display */}
                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm text-muted-foreground mb-1">Calculation:</p>
                    <p className="font-mono text-base">{anionGapResult.formula}</p>
                    {anionGapResult.correctionFormula && (
                      <>
                        <p className="text-sm text-muted-foreground mt-2 mb-1">Albumin Correction:</p>
                        <p className="font-mono text-base">{anionGapResult.correctionFormula}</p>
                      </>
                    )}
                  </div>

                  {/* Result Display */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-6 rounded-lg bg-muted/30">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Raw Anion Gap</p>
                      <p className="text-3xl font-bold font-mono">{anionGapResult.value.toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">mEq/L</p>
                    </div>
                    {anionGapResult.correctionFormula && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Corrected AG</p>
                        <p className={cn(
                          "text-3xl font-bold font-mono",
                          anionGapResult.status === "high" ? "text-clinical-red" :
                            anionGapResult.status === "normal" ? "text-clinical-green" :
                              "text-clinical-purple"
                        )}>
                          {anionGapResult.correctedValue.toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">mEq/L</p>
                      </div>
                    )}
                  </div>

                  {/* Status Interpretation */}
                  {/* {agStatusInfo && (
                    <div
                      className={cn(
                        "p-4 rounded-lg border-l-4",
                        agStatusInfo.bgColor,
                        agStatusInfo.borderColor
                      )}
                      data-testid="anion-gap-interpretation"
                    >
                      <p className={cn("font-bold text-lg", agStatusInfo.color)}>
                        {agStatusInfo.label}
                      </p>
                      {agStatusInfo.mnemonic && (
                        <p className="text-sm font-medium mt-1">
                          Mnemonic: "{agStatusInfo.mnemonic}"
                        </p>
                      )}
                      <p className="text-sm text-foreground/80 mt-1">
                        {agStatusInfo.description}
                      </p>
                    </div>
                  )} */}
                </div>
              )}

              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between pt-4">
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
    </div >
  );
}
