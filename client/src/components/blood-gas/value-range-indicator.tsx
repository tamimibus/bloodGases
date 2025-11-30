import { cn } from "@/lib/utils";

interface ValueRangeIndicatorProps {
  value: number | undefined;
  min: number;
  max: number;
  normalLow: number;
  normalHigh: number;
  unit: string;
  label: string;
  showLabels?: boolean;
}

export function ValueRangeIndicator({
  value,
  min,
  max,
  normalLow,
  normalHigh,
  unit,
  label,
  showLabels = true,
}: ValueRangeIndicatorProps) {
  const range = max - min;
  
  // Calculate positions as percentages
  const normalLowPosition = ((normalLow - min) / range) * 100;
  const normalHighPosition = ((normalHigh - min) / range) * 100;
  const valuePosition = value !== undefined 
    ? Math.max(0, Math.min(100, ((value - min) / range) * 100))
    : null;

  // Determine which zone the value is in
  const getZoneColor = () => {
    if (value === undefined) return "";
    if (value < normalLow) return "bg-clinical-red";
    if (value > normalHigh) return "bg-clinical-orange";
    return "bg-clinical-green";
  };

  const getZoneLabel = () => {
    if (value === undefined) return "";
    if (value < normalLow) return "Low";
    if (value > normalHigh) return "High";
    return "Normal";
  };

  return (
    <div className="w-full space-y-2" data-testid={`range-indicator-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{min}{unit}</span>
          <span className="font-medium text-foreground">{label}</span>
          <span>{max}{unit}</span>
        </div>
      )}

      {/* Range bar */}
      <div className="relative h-3 rounded-full bg-gradient-to-r from-clinical-red/30 via-clinical-green/30 to-clinical-orange/30 overflow-hidden">
        {/* Normal zone highlight */}
        <div
          className="absolute top-0 bottom-0 bg-clinical-green/40"
          style={{
            left: `${normalLowPosition}%`,
            width: `${normalHighPosition - normalLowPosition}%`,
          }}
        />

        {/* Normal zone borders */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-clinical-green dark:bg-clinical-green"
          style={{ left: `${normalLowPosition}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-clinical-green dark:bg-clinical-green"
          style={{ left: `${normalHighPosition}%` }}
        />

        {/* Value marker */}
        {valuePosition !== null && (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md transition-all duration-300",
              getZoneColor(),
              "ring-2 ring-white dark:ring-card"
            )}
            style={{ left: `calc(${valuePosition}% - 0.5rem)` }}
          />
        )}
      </div>

      {/* Zone labels */}
      <div className="flex justify-between text-xs">
        <span className="text-clinical-red font-medium">
          {label === "pH" ? "Acidaemia" : "Low"}
        </span>
        <span className="text-clinical-green font-medium">
          Normal ({normalLow} - {normalHigh})
        </span>
        <span className="text-clinical-orange font-medium">
          {label === "pH" ? "Alkalaemia" : "High"}
        </span>
      </div>

      {/* Current value display */}
      {value !== undefined && (
        <div className="text-center">
          <span className={cn(
            "text-lg font-bold",
            value < normalLow ? "text-clinical-red" :
            value > normalHigh ? "text-clinical-orange" :
            "text-clinical-green"
          )}>
            {value.toFixed(label === "pH" ? 2 : 1)} {unit}
          </span>
          <span className={cn(
            "ml-2 text-sm font-medium",
            value < normalLow ? "text-clinical-red" :
            value > normalHigh ? "text-clinical-orange" :
            "text-clinical-green"
          )}>
            ({getZoneLabel()})
          </span>
        </div>
      )}
    </div>
  );
}
