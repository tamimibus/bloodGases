import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Beaker } from "lucide-react";
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

const phSchema = z.object({
  pH: z.coerce
    .number()
    .min(6.8, "pH must be at least 6.8")
    .max(7.8, "pH must be at most 7.8"),
});

type PHFormData = z.infer<typeof phSchema>;

// Helper to parse value, ensuring it's a number or undefined
const parseValue = (value: any): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

export function StepPH() {
  const { input, updateInput, goToNextStep } = useWizard();

  const form = useForm<PHFormData>({
    resolver: zodResolver(phSchema),
    defaultValues: {
      pH: input.pH ?? (undefined as unknown as number),
    },
  });

  const watchedPH = parseValue(form.watch("pH"));

  const onSubmit = (data: PHFormData) => {
    updateInput({ pH: data.pH });
    goToNextStep();
  };

  const getpHInterpretation = (ph: number | undefined) => {
    if (ph === undefined) return null;
    if (ph < 7.35) {
      return {
        status: "Acidaemia",
        description: "pH is below normal range, indicating acidaemia.",
        color: "text-clinical-red",
        bgColor: "bg-clinical-red-light",
        borderColor: "border-clinical-red",
      };
    }
    if (ph > 7.45) {
      return {
        status: "Alkalaemia",
        description: "pH is above normal range, indicating alkalaemia.",
        color: "text-clinical-orange",
        bgColor: "bg-clinical-orange-light",
        borderColor: "border-clinical-orange",
      };
    }
    return {
      status: "Normal",
      description: "pH is within normal range.",
      color: "text-clinical-green",
      bgColor: "bg-clinical-green-light",
      borderColor: "border-clinical-green",
    };
  };

  const interpretation = getpHInterpretation(watchedPH);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Beaker className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Step 1: pH Analysis</CardTitle>
              <CardDescription>
                Enter the arterial blood gas pH value to begin interpretation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      />
                    </FormControl>
                    <FormDescription>
                      Normal range: {normalRanges.pH.low} - {normalRanges.pH.high}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Visual Range Indicator */}
              <div className="pt-4">
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

              {/* Interpretation Card */}
              {interpretation && (
                <div
                  className={`p-4 rounded-lg border-l-4 ${interpretation.bgColor} ${interpretation.borderColor}`}
                  data-testid="ph-interpretation"
                >
                  <p className={`font-bold text-lg ${interpretation.color}`}>
                    {interpretation.status}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1">
                    {interpretation.description}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={!watchedPH}
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
          <h3 className="font-semibold mb-3">Understanding pH in Blood Gas Analysis</h3>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-clinical-red">Acidaemia (pH {"<"} 7.35)</p>
              <p className="text-muted-foreground">
                Indicates excess acid or loss of base in the blood.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-clinical-green">Normal (pH 7.35-7.45)</p>
              <p className="text-muted-foreground">
                Normal acid-base balance.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-clinical-orange">Alkalaemia (pH {">"} 7.45)</p>
              <p className="text-muted-foreground">
                Indicates excess base or loss of acid.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
