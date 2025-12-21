import { useState, useMemo, useEffect } from "react";
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
  Na: z.coerce
    .number()
    .min(100, "Please enter a sodium value between 100 and 200 mmol/L")
    .max(200, "Please enter a sodium value between 100 and 200 mmol/L")
    .optional(),
  measuredOsmolality: z.coerce
    .number()
    .min(200, "Please enter an osmolality value between 200 and 400 mOsm/kg")
    .max(400, "Please enter an osmolality value between 200 and 400 mOsm/kg")
    .optional(),
  glucose: z.coerce
    .number()
    .min(0, "Glucose value must be positive")
    .max(2000, "Glucose value seems too high - please verify")
    .optional(),
  urea: z.coerce
    .number()
    .min(0, "Urea value must be positive")
    .max(500, "Urea value seems too high - please verify")
    .optional(),
  ethanol: z.coerce
    .number()
    .min(0, "Ethanol value must be positive")
    .max(1000, "Ethanol value seems too high - please verify")
    .optional(),
  hasKetones: z.boolean().optional(),
  hasVisionChanges: z.boolean().optional(),
  hasCalciumOxalate: z.boolean().optional(),
});

type OsmolarGapFormData = z.infer<typeof osmolarGapSchema>;

export function StepOsmolarGap() {
  const { input, updateInput, goToNextStep, goToPreviousStep, interpretation } = useWizard();

  // Conversion factors
  const UREA_CF = 2.80112;
  const GLUCOSE_CF = 18.01802;
  const ETHANOL_CF = 4.6083;

  const form = useForm<OsmolarGapFormData>({
    resolver: zodResolver(osmolarGapSchema),
    defaultValues: {
      Na: input.Na ?? (undefined as unknown as number),
      measuredOsmolality: input.measuredOsmolality ?? (undefined as unknown as number),
      // Default to mg/dL: Convert stored mmol/L to mg/dL
      glucose: input.glucose ? parseFloat((input.glucose * GLUCOSE_CF).toFixed(1)) : (undefined as unknown as number),
      urea: input.urea ? parseFloat((input.urea * UREA_CF).toFixed(1)) : (undefined as unknown as number),
      ethanol: input.ethanol ? parseFloat((input.ethanol * ETHANOL_CF).toFixed(1)) : (undefined as unknown as number),
      hasKetones: input.hasKetones,
      hasVisionChanges: input.hasVisionChanges,
      hasCalciumOxalate: input.hasCalciumOxalate,
    },
  });

  const parseValue = (val: any): number | undefined => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  const watchedNa = parseValue(form.watch("Na"));
  const watchedMeasuredOsm = parseValue(form.watch("measuredOsmolality"));
  const watchedGlucose = parseValue(form.watch("glucose"));
  const watchedUrea = parseValue(form.watch("urea"));
  const watchedEthanol = parseValue(form.watch("ethanol"));

  // Unit state - Defaults to mg/dL
  const [glucoseUnit, setGlucoseUnit] = useState<"mmol/L" | "mg/dL">("mg/dL");
  const [ureaUnit, setUreaUnit] = useState<"mmol/L" | "mg/dL">("mg/dL");
  const [ethanolUnit, setEthanolUnit] = useState<"mmol/L" | "mg/dL">("mg/dL");

  const toMmol = (value: number | undefined, unit: "mmol/L" | "mg/dL", factor: number) => {
    if (value === undefined) return undefined;
    if (unit === "mmol/L") return value;
    return value / factor;
  };

  // Auto-save changes to global state
  const values = form.watch();
  useEffect(() => {
    const handler = setTimeout(() => {
      // Must convert units before saving to global state (similar to onSubmit)
      updateInput({
        Na: parseValue(values.Na),
        measuredOsmolality: parseValue(values.measuredOsmolality),
        glucose: toMmol(parseValue(values.glucose), glucoseUnit, GLUCOSE_CF),
        urea: toMmol(parseValue(values.urea), ureaUnit, UREA_CF),
        ethanol: toMmol(parseValue(values.ethanol), ethanolUnit, ETHANOL_CF),
        hasKetones: values.hasKetones,
        hasVisionChanges: values.hasVisionChanges,
        hasCalciumOxalate: values.hasCalciumOxalate,
      });
    }, 500);

    return () => clearTimeout(handler);
  }, [JSON.stringify(values), updateInput, glucoseUnit, ureaUnit, ethanolUnit, GLUCOSE_CF, UREA_CF, ETHANOL_CF]);

  // Ensure values are saved on unmount
  useEffect(() => {
    return () => {
      const vals = form.getValues();
      updateInput({
        Na: vals.Na,
        measuredOsmolality: vals.measuredOsmolality,
        glucose: toMmol(vals.glucose, glucoseUnit, GLUCOSE_CF),
        urea: toMmol(vals.urea, ureaUnit, UREA_CF),
        ethanol: toMmol(vals.ethanol, ethanolUnit, ETHANOL_CF),
        hasKetones: vals.hasKetones,
        hasVisionChanges: vals.hasVisionChanges,
        hasCalciumOxalate: vals.hasCalciumOxalate,
      });
    };
  }, [updateInput, form, glucoseUnit, ureaUnit, ethanolUnit, GLUCOSE_CF, UREA_CF, ETHANOL_CF]);

  // onSubmit: Convert everything to mmol/L for storage
  const onSubmit = (data: OsmolarGapFormData) => {
    updateInput({
      Na: data.Na,
      measuredOsmolality: data.measuredOsmolality,
      glucose: toMmol(data.glucose, glucoseUnit, GLUCOSE_CF),
      urea: toMmol(data.urea, ureaUnit, UREA_CF),
      ethanol: toMmol(data.ethanol, ethanolUnit, ETHANOL_CF),
      hasKetones: data.hasKetones,
      hasVisionChanges: data.hasVisionChanges,
      hasCalciumOxalate: data.hasCalciumOxalate,
    });
    goToNextStep();
  };

  // Helper to switch unit and convert displayed value
  const handleUnitChange = (
    field: "glucose" | "urea" | "ethanol",
    targetUnit: "mmol/L" | "mg/dL",
    currentUnit: "mmol/L" | "mg/dL",
    setUnit: (u: "mmol/L" | "mg/dL") => void,
    factor: number
  ) => {
    if (targetUnit === currentUnit) return;

    const globalVal = form.getValues(field);
    const currentValue = parseValue(globalVal);
    setUnit(targetUnit);

    if (currentValue !== undefined && currentValue !== null) {
      // Convert value to new unit
      // If going to mg/dL (current is mmol/L): val * factor
      // If going to mmol/L (current is mg/dL): val / factor
      const newValue = targetUnit === "mg/dL"
        ? currentValue * factor
        : currentValue / factor;

      form.setValue(field, parseFloat(newValue.toFixed(1)));
    }
  };

  const getWarning = (val: number | undefined, min: number, max: number) => {
    if (val !== undefined && (val < min || val > max)) {
      return "value is too high / too low , please double check your input";
    }
    return undefined;
  };

  // Calculate osmolar gap if we have required values
  // Use local Na if available (in case it was just entered), otherwise global
  const inputNa = parseValue(input.Na);
  const sodiumValue = watchedNa ?? inputNa;

  const osmolarGapResult =
    watchedMeasuredOsm !== undefined &&
      sodiumValue !== undefined &&
      watchedGlucose !== undefined &&
      watchedUrea !== undefined
      ? calculateOsmolarGap(
        watchedMeasuredOsm,
        sodiumValue,
        toMmol(watchedGlucose, glucoseUnit, GLUCOSE_CF)!,
        toMmol(watchedUrea, ureaUnit, UREA_CF)!,
        toMmol(watchedEthanol, ethanolUnit, ETHANOL_CF)
      )
      : null;

  // HAGMA Check (Primary metabolic acidosis + High AG)
  const isPrimaryMA = input.pH !== undefined && input.pCO2 !== undefined && input.HCO3 !== undefined &&
    (interpretation?.primaryDisorder === 'metabolic_acidosis' || interpretation?.secondaryDisorders.includes("Concurrent metabolic acidosis"));
  const isHighAG = interpretation?.anionGap?.status === "high";
  const isHAGMA = isHighAG; // Restore alias for usage in CardDescription

  // Low Calculated Osmolality Check
  const isLowCalcOsm = osmolarGapResult && osmolarGapResult.calculatedOsmolality < 270;

  // Render Diagnostic Logic
  const renderDiagnosticTree = () => {
    if (!osmolarGapResult?.isElevated) return null;

    // Path 1: No Metabolic Acidosis
    if (!isPrimaryMA) {
      return (
        <div className="space-y-4 pt-4 border-t">
          <FormField
            control={form.control}
            name="hasKetones"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base">Are ketones present in blood or urine?</FormLabel>
                <FormControl>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={field.value === true ? "default" : "outline"}
                      onClick={() => field.onChange(true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === false ? "default" : "outline"}
                      onClick={() => field.onChange(false)}
                    >
                      No
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch("hasKetones") !== undefined && (
            <div className="p-4 rounded-lg bg-muted text-lg font-medium">
              {form.watch("hasKetones")
                ? "Consider Isopropyl Alcohol as a cause"
                : "Consider Ethanol as a cause"}
            </div>
          )}
        </div>
      );
    }

    // Path 2: Yes MA
    if (isPrimaryMA) {
      // Path 2a: No High AG
      if (!isHighAG) {
        return (
          <div className="mt-6 p-4 rounded-lg bg-muted text-lg font-medium">
            Consider Propylene Glycol ingestion
          </div>
        );
      }

      // Path 2b: High AG (HAGMA)
      const glucoseValue = toMmol(watchedGlucose, glucoseUnit, GLUCOSE_CF);

      // DKA Check (Glucose > 350 mg/dL approx 19.4 mmol/L)
      if (glucoseValue && glucoseValue > 19.4) {
        return (
          <div className="mt-6 p-4 rounded-lg bg-muted text-lg font-medium">
            Consider DKA
          </div>
        );
      }

      // Toxic Alcohol Checks (Methanol/Ethylene Glycol)
      return (
        <div className="space-y-6 pt-4 border-t">
          {/* Step 1: Vision Changes */}
          <FormField
            control={form.control}
            name="hasVisionChanges"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base">Are there any acute vision changes?</FormLabel>
                <FormControl>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={field.value === true ? "default" : "outline"}
                      onClick={() => field.onChange(true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === false ? "default" : "outline"}
                      onClick={() => field.onChange(false)}
                    >
                      No
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("hasVisionChanges") === true && (
            <div className="p-4 rounded-lg bg-muted text-lg font-medium">
              Consider Methanol as a cause
            </div>
          )}

          {/* Step 2: Crystals (Only if no vision changes or unchecked?) Logic says "If No (vision) -> ask crystals" */}
          {form.watch("hasVisionChanges") === false && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasCalciumOxalate"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base">Is UA significant for Calcium oxalate crystals?</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={field.value === true ? "default" : "outline"}
                          onClick={() => field.onChange(true)}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === false ? "default" : "outline"}
                          onClick={() => field.onChange(false)}
                        >
                          No
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("hasCalciumOxalate") !== undefined && (
                <div className="p-4 rounded-lg bg-muted text-lg font-medium">
                  {form.watch("hasCalciumOxalate")
                    ? "Consider Ethylene Glycol as a cause"
                    : "Consider mixed alcohol ingestion or late methanol stage"}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const canSkip = !isHighAG; // Keeping existing logic for skip, or simplify? User didn't specify.

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
              <CardTitle className="text-xl">Step 3: Osmolar Gap (Optional)</CardTitle>
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
              {/* Conditional Sodium Input (if skipped in previous step) */}
              {input.Na === undefined && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 mb-6">
                  <FormField
                    control={form.control}
                    name="Na"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Beaker className="w-4 h-4 text-clinical-blue" />
                          Sodium (Na⁺)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="140"
                            className="text-lg h-11 font-mono bg-white"
                            data-testid="input-na-conditional"
                            {...field}
                            tooltip=" Good —  is within the 100 - 155 "
                            onChange={field.onChange}
                            value={field.value ?? ""}
                            onMouseEnter={(e) => {
                              const val = parseValue(field.value);
                              if (val !== undefined && (val < 100 || val > 155)) {
                                e.currentTarget.title = "value is too high / too low , please double check your input";
                              } else {
                                e.currentTarget.title = "";
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Required for Osmolar Gap calculation.
                          Normal: 135-145 mmol/L
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
                        max={160}
                        normalLow={135}
                        normalHigh={145}
                        unit=" mmol/L"
                        label="Sodium"
                      />
                    </div>
                  )}
                </div>
              )}

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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-semibold">
                          Measured Osmolality (mOsm/kg)
                        </FormLabel>
                        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 opacity-50 cursor-not-allowed">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled
                            className="h-6 rounded-md px-2 text-xs font-medium bg-primary text-primary-foreground shadow-sm"
                          >
                            mOsm/kg
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="290"
                          className="text-lg h-11 font-mono"
                          data-testid="input-measured-osmolality"
                          {...field}
                          onChange={field.onChange}
                          value={field.value ?? ""}
                          tooltip={getWarning(parseValue(field.value), 270, 320)}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: 280-295 mOsm/kg
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Glucose */}
                <FormField
                  control={form.control}
                  name="glucose"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-semibold">
                          Glucose
                        </FormLabel>
                        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnitChange("glucose", "mmol/L", glucoseUnit, setGlucoseUnit, GLUCOSE_CF)}
                            className={cn(
                              "h-6 rounded-md px-2 text-xs font-medium transition-all hover:bg-background/80",
                              glucoseUnit === "mmol/L" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            )}
                          >
                            mmol/L
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnitChange("glucose", "mg/dL", glucoseUnit, setGlucoseUnit, GLUCOSE_CF)}
                            className={cn(
                              "h-6 rounded-md px-2 text-xs font-medium transition-all hover:bg-background/80",
                              glucoseUnit === "mg/dL" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            )}
                          >
                            mg/dL
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={glucoseUnit === "mmol/L" ? "5.0" : "90"}
                          className="text-lg h-11 font-mono"
                          data-testid="input-glucose"
                          {...field}
                          onChange={field.onChange}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: {glucoseUnit === "mmol/L" ? "3.9-6.1 mmol/L" : `${(3.9 * GLUCOSE_CF).toFixed(0)}-${(6.1 * GLUCOSE_CF).toFixed(0)} mg/dL`}
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
                      max={glucoseUnit === "mmol/L" ? 50 : 50 * GLUCOSE_CF}
                      normalLow={glucoseUnit === "mmol/L" ? 3.9 : 3.9 * GLUCOSE_CF}
                      normalHigh={glucoseUnit === "mmol/L" ? 6.1 : 6.1 * GLUCOSE_CF}
                      unit={` ${glucoseUnit}`}
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-semibold">
                          Urea
                        </FormLabel>
                        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnitChange("urea", "mmol/L", ureaUnit, setUreaUnit, UREA_CF)}
                            className={cn(
                              "h-6 rounded-md px-2 text-xs font-medium transition-all hover:bg-background/80",
                              ureaUnit === "mmol/L" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            )}
                          >
                            mmol/L
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnitChange("urea", "mg/dL", ureaUnit, setUreaUnit, UREA_CF)}
                            className={cn(
                              "h-6 rounded-md px-2 text-xs font-medium transition-all hover:bg-background/80",
                              ureaUnit === "mg/dL" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            )}
                          >
                            mg/dL
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={ureaUnit === "mmol/L" ? "5.0" : "14"}
                          className="text-lg h-11 font-mono"
                          data-testid="input-urea"
                          {...field}
                          onChange={field.onChange}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: {ureaUnit === "mmol/L" ? "2.5-7.1 mmol/L" : `${(2.5 * UREA_CF).toFixed(0)}-${(7.1 * UREA_CF).toFixed(0)} mg/dL`}
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
                      max={ureaUnit === "mmol/L" ? 100 : 100 * UREA_CF}
                      normalLow={ureaUnit === "mmol/L" ? 2.5 : 2.5 * UREA_CF}
                      normalHigh={ureaUnit === "mmol/L" ? 7.1 : 7.1 * UREA_CF}
                      unit={` ${ureaUnit}`}
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-semibold">
                          Ethanol <span className="text-muted-foreground font-normal ml-1">(if known)</span>
                        </FormLabel>
                        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnitChange("ethanol", "mmol/L", ethanolUnit, setEthanolUnit, ETHANOL_CF)}
                            className={cn(
                              "h-6 rounded-md px-2 text-xs font-medium transition-all hover:bg-background/80",
                              ethanolUnit === "mmol/L" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            )}
                          >
                            mmol/L
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnitChange("ethanol", "mg/dL", ethanolUnit, setEthanolUnit, ETHANOL_CF)}
                            className={cn(
                              "h-6 rounded-md px-2 text-xs font-medium transition-all hover:bg-background/80",
                              ethanolUnit === "mg/dL" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            )}
                          >
                            mg/dL
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          className="text-lg h-11 font-mono"
                          data-testid="input-ethanol"
                          {...field}
                          onChange={field.onChange}
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
                      max={ethanolUnit === "mmol/L" ? 100 : 100 * ETHANOL_CF}
                      normalLow={0}
                      normalHigh={0}
                      unit={` ${ethanolUnit}`}
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
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 p-6 rounded-lg bg-muted/30">
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

              {/* Low Calculated Osmolality Warning */}
              {isLowCalcOsm && (
                <div className="p-4 rounded-lg bg-yellow-500/15 border border-yellow-500/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-700">Calculated Osmolarity is less than 270</p>
                    <p className="text-sm text-yellow-600/90">Osmolar gap suspected to be high, please obtain serum osmolarity if not already obtained</p>
                  </div>
                </div>
              )}

              {/* Advanced Diagnostic Tree */}
              {renderDiagnosticTree()}

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
                <div className="flex flex-col gap-3 sm:flex-row">
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
