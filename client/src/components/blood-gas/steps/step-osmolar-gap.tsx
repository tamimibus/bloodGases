import React, { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Beaker, AlertTriangle, CheckCircle, Atom } from "lucide-react";
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
  Na: z.coerce.number().optional(),
  measuredOsmolality: z.coerce.number().optional(),
  glucose: z.coerce.number().optional(),
  urea: z.coerce.number().optional(),
  ethanol: z.coerce.number().optional(),
  hasKetones: z.boolean().optional(),
  hasVisionChanges: z.boolean().optional(),
  hasCalciumOxalate: z.boolean().optional(),
});

type OsmolarGapFormData = z.infer<typeof osmolarGapSchema>;

export function StepOsmolarGap() {
  const { input, updateInput, goToNextStep, goToPreviousStep, interpretation } = useWizard();

  // Track if Na was initially undefined (user skipped it in previous step)
  const naWasSkippedRef = React.useRef(input.Na === undefined);

  // Conversion factors
  const UREA_CF = 2.80112;
  const GLUCOSE_CF = 18.01802;
  const ETHANOL_CF = 4.6083;

  const form = useForm<OsmolarGapFormData>({
    resolver: zodResolver(osmolarGapSchema),
    defaultValues: {
      Na: input.Na ?? (undefined as unknown as number),
      measuredOsmolality: input.measuredOsmolality ?? (undefined as unknown as number),
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

  // Unit state
  const [glucoseUnit, setGlucoseUnit] = useState<"mmol/L" | "mg/dL">("mg/dL");
  const [ureaUnit, setUreaUnit] = useState<"mmol/L" | "mg/dL">("mg/dL");
  const [ethanolUnit, setEthanolUnit] = useState<"mmol/L" | "mg/dL">("mg/dL");

  const toMmol = (value: number | undefined, unit: "mmol/L" | "mg/dL", factor: number) => {
    if (value === undefined) return undefined;
    if (unit === "mmol/L") return value;
    return value / factor;
  };

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

  // Auto-save
  const values = form.watch();
  useEffect(() => {
    const handler = setTimeout(() => {
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
  }, [JSON.stringify(values), updateInput, glucoseUnit, ureaUnit, ethanolUnit]);

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
  }, [updateInput, form, glucoseUnit, ureaUnit, ethanolUnit]);

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
      const newValue = targetUnit === "mg/dL" ? currentValue * factor : currentValue / factor;
      form.setValue(field, parseFloat(newValue.toFixed(1)));
    }
  };

  const sodiumValue = watchedNa ?? parseValue(input.Na);

  const osmolarGapResult =
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

  const isPrimaryMA = input.pH !== undefined && input.pCO2 !== undefined && input.HCO3 !== undefined &&
    (interpretation?.primaryDisorder === 'metabolic_acidosis' || interpretation?.secondaryDisorders.includes("Concurrent metabolic acidosis"));
  const isHighAG = interpretation?.anionGap?.status === "high";

  const isLowCalcOsm = osmolarGapResult && osmolarGapResult.calculatedOsmolality < 270;

  const renderDiagnosticTree = () => {
    if (!osmolarGapResult?.isElevated) return null;
    if (!isPrimaryMA) {
      return (
        <div className="space-y-4 pt-4 border-t">
          <FormField
            control={form.control}
            name="hasKetones"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-semibold">Are ketones present in blood or urine?</FormLabel>
                <FormControl>
                  <div className="flex gap-4">
                    <Button type="button" variant={field.value === true ? "default" : "outline"} onClick={() => field.onChange(true)}>Yes</Button>
                    <Button type="button" variant={field.value === false ? "default" : "outline"} onClick={() => field.onChange(false)}>No</Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch("hasKetones") !== undefined && (
            <div className="p-4 rounded-lg bg-muted text-lg font-medium border-l-4 border-l-primary">
              {form.watch("hasKetones") ? "Consider Isopropyl Alcohol as a cause" : "Consider Ethanol as a cause"}
            </div>
          )}
        </div>
      );
    }

    if (isPrimaryMA) {
      if (!isHighAG) {
        return (
          <div className="mt-6 p-4 rounded-lg bg-muted text-lg font-medium border-l-4 border-l-primary">
            Consider Propylene Glycol ingestion
          </div>
        );
      }

      const glucoseValue = toMmol(watchedGlucose, glucoseUnit, GLUCOSE_CF);
      if (glucoseValue && glucoseValue > 19.4) {
        return (
          <div className="mt-6 p-4 rounded-lg bg-muted text-lg font-medium border-l-4 border-l-primary">
            Consider DKA
          </div>
        );
      }

      return (
        <div className="space-y-6 pt-4 border-t">
          <FormField
            control={form.control}
            name="hasVisionChanges"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-semibold">Are there any acute vision changes?</FormLabel>
                <FormControl>
                  <div className="flex gap-4">
                    <Button type="button" variant={field.value === true ? "default" : "outline"} onClick={() => field.onChange(true)}>Yes</Button>
                    <Button type="button" variant={field.value === false ? "default" : "outline"} onClick={() => field.onChange(false)}>No</Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch("hasVisionChanges") === true && (
            <div className="p-4 rounded-lg bg-muted text-lg font-medium border-l-4 border-l-primary">
              Consider Methanol as a cause
            </div>
          )}
          {form.watch("hasVisionChanges") === false && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasCalciumOxalate"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Is UA significant for Calcium oxalate crystals?</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        <Button type="button" variant={field.value === true ? "default" : "outline"} onClick={() => field.onChange(true)}>Yes</Button>
                        <Button type="button" variant={field.value === false ? "default" : "outline"} onClick={() => field.onChange(false)}>No</Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("hasCalciumOxalate") !== undefined && (
                <div className="p-4 rounded-lg bg-muted text-lg font-medium border-l-4 border-l-primary">
                  {form.watch("hasCalciumOxalate") ? "Consider Ethylene Glycol as a cause" : "Consider mixed alcohol ingestion or late methanol stage"}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleSkip = () => goToNextStep();

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
                {isHighAG
                  ? "Recommended for HAGMA to identify toxic alcohols"
                  : "Optional calculation - useful for suspected toxic alcohol ingestion"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {naWasSkippedRef.current && (
                <div className="space-y-4 p-4 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-900/30 dark:border-orange-700">
                  <FormField
                    control={form.control}
                    name="Na"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2 text-xl font-bold">
                          <Atom className="w-4 h-4 text-clinical-blue" />
                          Sodium (Na⁺)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="140"
                            className="text-lg h-11 font-mono"
                            data-testid="input-na-conditional"
                            {...field}
                            onChange={field.onChange}
                            value={field.value ?? ""}
                            tooltip={`Expected range: 100 - 180`}
                          />
                        </FormControl>
                        {getWarningText(watchedNa, 100, 180, "Na⁺")}
                        {watchedNa !== undefined && (
                          <div className="pt-2">
                            <ValueRangeIndicator value={watchedNa} min={100} max={180} normalLow={135} normalHigh={145} unit=" mmol/L" label="Sodium" />
                          </div>
                        )}
                        <FormDescription>Required for Osmolar Gap calculation. Normal: 135-145 mmol/L</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-2">Calculated Osmolality Formula:</p>
                <p className="text-base font-mono font-semibold">Osm = 2×[Na⁺] + Glucose + Urea (+ EtOH/4.6)</p>
                <p className="text-sm text-muted-foreground mt-2">Osmolar Gap = Measured - Calculated (Normal: -10 to +10 mOsm/kg)</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
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

                          {/* <FormLabel className="text-base font-semibold">Measured Osmolality (mOsm/kg)</FormLabel> */}
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
                            tooltip={`Expected range: 200 - 450`}
                          />
                        </FormControl>
                        {getWarningText(watchedMeasuredOsm, 200, 450, "Measured Osmolality")}
                        <FormDescription>Normal: 280-295 mOsm/kg</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="glucose"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base font-semibold">Glucose</FormLabel>
                          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleUnitChange("glucose", "mmol/L", glucoseUnit, setGlucoseUnit, GLUCOSE_CF)} className={cn("h-6 rounded-md px-2 text-xs font-medium", glucoseUnit === "mmol/L" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90")}>mmol/L</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleUnitChange("glucose", "mg/dL", glucoseUnit, setGlucoseUnit, GLUCOSE_CF)} className={cn("h-6 rounded-md px-2 text-xs font-medium", glucoseUnit === "mg/dL" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90")}>mg/dL</Button>
                          </div>
                        </div>
                        <FormControl>
                          <Input type="number" placeholder={glucoseUnit === "mmol/L" ? "5.0" : "90"} className="text-lg h-11 font-mono" data-testid="input-glucose" {...field} onChange={field.onChange} value={field.value ?? ""} tooltip={`Expected range: ${glucoseUnit === 'mmol/L' ? '2 - 50' : '35 - 900'}`} />
                        </FormControl>
                        {getWarningText(watchedGlucose, glucoseUnit === 'mmol/L' ? 2 : 35, glucoseUnit === 'mmol/L' ? 50 : 900, "Glucose")}
                        {watchedGlucose !== undefined && (
                          <div className="pt-2">
                            <ValueRangeIndicator value={watchedGlucose} min={0} max={glucoseUnit === "mmol/L" ? 50 : 50 * GLUCOSE_CF} normalLow={glucoseUnit === "mmol/L" ? 3.9 : 3.9 * GLUCOSE_CF} normalHigh={glucoseUnit === "mmol/L" ? 6.1 : 6.1 * GLUCOSE_CF} unit={` ${glucoseUnit}`} label="Glucose" />
                          </div>
                        )}
                        <FormDescription>Normal: {glucoseUnit === "mmol/L" ? "3.9-6.1 mmol/L" : "70-110 mg/dL"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="urea"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base font-semibold">Urea</FormLabel>
                          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleUnitChange("urea", "mmol/L", ureaUnit, setUreaUnit, UREA_CF)} className={cn("h-6 rounded-md px-2 text-xs font-medium", ureaUnit === "mmol/L" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90")}>mmol/L</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleUnitChange("urea", "mg/dL", ureaUnit, setUreaUnit, UREA_CF)} className={cn("h-6 rounded-md px-2 text-xs font-medium", ureaUnit === "mg/dL" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90")}>mg/dL</Button>
                          </div>
                        </div>
                        <FormControl>
                          <Input type="number" placeholder={ureaUnit === "mmol/L" ? "5.0" : "14"} className="text-lg h-11 font-mono" data-testid="input-urea" {...field} onChange={field.onChange} value={field.value ?? ""} tooltip={`Expected range: ${ureaUnit === 'mmol/L' ? '1 - 100' : '3 - 280'}`} />
                        </FormControl>
                        {getWarningText(watchedUrea, ureaUnit === 'mmol/L' ? 1 : 3, ureaUnit === 'mmol/L' ? 100 : 280, "Urea")}
                        {watchedUrea !== undefined && (
                          <div className="pt-2">
                            <ValueRangeIndicator value={watchedUrea} min={0} max={ureaUnit === "mmol/L" ? 100 : 100 * UREA_CF} normalLow={ureaUnit === "mmol/L" ? 2.5 : 2.5 * UREA_CF} normalHigh={ureaUnit === "mmol/L" ? 7.1 : 7.1 * UREA_CF} unit={` ${ureaUnit}`} label="Urea" />
                          </div>
                        )}
                        <FormDescription>Normal: {ureaUnit === "mmol/L" ? "2.5-7.1 mmol/L" : "7-20 mg/dL"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ethanol"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base font-semibold">Ethanol <span className="text-muted-foreground font-normal ml-1">(optional)</span></FormLabel>
                          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleUnitChange("ethanol", "mmol/L", ethanolUnit, setEthanolUnit, ETHANOL_CF)} className={cn("h-6 rounded-md px-2 text-xs font-medium", ethanolUnit === "mmol/L" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90")}>mmol/L</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleUnitChange("ethanol", "mg/dL", ethanolUnit, setEthanolUnit, ETHANOL_CF)} className={cn("h-6 rounded-md px-2 text-xs font-medium", ethanolUnit === "mg/dL" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90")}>mg/dL</Button>
                          </div>
                        </div>
                        <FormControl>
                          <Input type="number" placeholder="0" className="text-lg h-11 font-mono" data-testid="input-ethanol" {...field} onChange={field.onChange} value={field.value ?? ""} tooltip={`Expected range: ${ethanolUnit === 'mmol/L' ? '0 - 100' : '0 - 460'}`} />
                        </FormControl>
                        {getWarningText(watchedEthanol, 0, ethanolUnit === 'mmol/L' ? 100 : 460, "Ethanol")}
                        {watchedEthanol !== undefined && watchedEthanol > 0 && (
                          <div className="pt-2">
                            <ValueRangeIndicator value={watchedEthanol} min={0} max={ethanolUnit === "mmol/L" ? 100 : 100 * ETHANOL_CF} normalLow={0} normalHigh={0} unit={` ${ethanolUnit}`} label="Ethanol" />
                          </div>
                        )}
                        <FormDescription>Include if ethanol level measured</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {osmolarGapResult && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm text-muted-foreground mb-1">Calculation:</p>
                    <p className="font-mono text-sm">{osmolarGapResult.formula}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 p-6 rounded-lg bg-muted/30">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Calculated</p>
                      <p className="text-2xl font-bold font-mono">{osmolarGapResult.calculatedOsmolality.toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">mOsm/kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Measured</p>
                      <p className="text-2xl font-bold font-mono">{osmolarGapResult.measuredOsmolality ?? "-"}</p>
                      <p className="text-sm text-muted-foreground">mOsm/kg</p>
                    </div>
                    {osmolarGapResult.gap !== undefined && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Osmolar Gap</p>
                        <p className={cn("text-3xl font-bold font-mono", osmolarGapResult.isElevated ? "text-clinical-red" : "text-clinical-green")}>{osmolarGapResult.gap.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">mOsm/kg</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isLowCalcOsm && input.measuredOsmolality === undefined && (
                <div className="p-4 rounded-lg bg-yellow-500/15 border border-yellow-500/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-700">Calculated Osmolarity is less than 270</p>
                    <p className="text-sm text-yellow-600/90">Osmolar gap suspected to be high, please obtain serum osmolarity if not already obtained</p>
                  </div>
                </div>
              )}

              {renderDiagnosticTree()}

              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between pt-4">
                <Button type="button" variant="outline" size="lg" onClick={goToPreviousStep} data-testid="button-previous-step">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {(!isHighAG) && (
                    <Button type="button" variant="ghost" size="lg" onClick={handleSkip} data-testid="button-skip">Skip</Button>
                  )}
                  <Button type="submit" size="lg" data-testid="button-next-step">
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
