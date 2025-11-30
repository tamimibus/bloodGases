import { cn } from "@/lib/utils";
import { useWizard } from "./wizard-context";

interface FlowchartNodeProps {
  id: string;
  label: string;
  type: "decision" | "result" | "calculation";
  color: "blue" | "orange" | "green" | "gray" | "red";
  isActive: boolean;
  isComplete: boolean;
  position: { x: number; y: number };
  onClick?: () => void;
}

function FlowchartNode({
  id,
  label,
  type,
  color,
  isActive,
  isComplete,
  position,
  onClick,
}: FlowchartNodeProps) {
  const colorClasses = {
    blue: {
      bg: "bg-clinical-blue-light",
      border: "border-clinical-blue",
      text: "text-clinical-blue-dark dark:text-clinical-blue",
      activeBg: "bg-clinical-blue",
      activeText: "text-white",
    },
    orange: {
      bg: "bg-clinical-orange-light",
      border: "border-clinical-orange",
      text: "text-clinical-orange-dark dark:text-clinical-orange",
      activeBg: "bg-clinical-orange",
      activeText: "text-white",
    },
    green: {
      bg: "bg-clinical-green-light",
      border: "border-clinical-green",
      text: "text-clinical-green-dark dark:text-clinical-green",
      activeBg: "bg-clinical-green",
      activeText: "text-white",
    },
    gray: {
      bg: "bg-clinical-gray-light",
      border: "border-clinical-gray",
      text: "text-clinical-gray-dark dark:text-clinical-gray",
      activeBg: "bg-clinical-gray",
      activeText: "text-white",
    },
    red: {
      bg: "bg-clinical-red-light",
      border: "border-clinical-red",
      text: "text-clinical-red-dark dark:text-clinical-red",
      activeBg: "bg-clinical-red",
      activeText: "text-white",
    },
  };

  const classes = colorClasses[color];

  return (
    <div
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
        onClick && "cursor-pointer hover-elevate"
      )}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      onClick={onClick}
      data-testid={`flowchart-node-${id}`}
    >
      <div
        className={cn(
          "px-3 py-2 rounded-md border-2 text-center text-xs font-medium transition-all duration-300",
          type === "decision" && "rounded-lg",
          type === "calculation" && "rounded-sm border-dashed",
          isActive
            ? cn(classes.activeBg, classes.activeText, "shadow-lg ring-4 ring-primary/20")
            : isComplete
            ? cn(classes.bg, classes.border, classes.text, "opacity-70")
            : cn(classes.bg, classes.border, classes.text, "opacity-40")
        )}
      >
        {label}
      </div>
    </div>
  );
}

export function Flowchart() {
  const { currentStep, input, interpretation, setCurrentStep } = useWizard();
  const path = interpretation
    ? [
        "ph",
        interpretation.pHStatus,
        interpretation.primaryDisorder,
        interpretation.anionGap?.status,
      ].filter(Boolean)
    : [];

  const isNodeActive = (nodeId: string) => {
    const stepNodes: Record<number, string[]> = {
      1: ["ph"],
      2: ["acidaemia", "alkalaemia", "normal", "respiratory_acidosis", "metabolic_acidosis", "respiratory_alkalosis", "metabolic_alkalosis"],
      3: ["anion_gap"],
      4: ["osmolar_gap"],
      5: ["compensation"],
      6: ["diagnosis"],
    };

    const activeNodes = stepNodes[currentStep] || [];
    return activeNodes.includes(nodeId) || path.includes(nodeId);
  };

  const isNodeComplete = (nodeId: string) => {
    return path.includes(nodeId);
  };

  return (
    <div className="relative w-full h-80 bg-card rounded-lg border border-border overflow-hidden" data-testid="flowchart">
      {/* pH Decision Node */}
      <FlowchartNode
        id="ph"
        label="pH"
        type="decision"
        color="gray"
        isActive={currentStep === 1}
        isComplete={input.pH !== undefined}
        position={{ x: 50, y: 12 }}
        onClick={() => setCurrentStep(1)}
      />

      {/* pH Thresholds */}
      <div className="absolute text-xs font-bold text-clinical-red" style={{ left: "28%", top: "8%" }}>
        {"<7.35"}
      </div>
      <div className="absolute text-xs font-bold text-clinical-orange" style={{ left: "68%", top: "8%" }}>
        {">7.45"}
      </div>

      {/* Connecting lines from pH - using viewBox for proper scaling */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Left branch (Acidaemia) */}
        <line
          x1="50" y1="18"
          x2="25" y2="28"
          stroke={path.includes("acidaemia") ? "hsl(var(--clinical-red))" : "hsl(var(--border))"}
          strokeWidth="0.5"
          className="transition-colors duration-300"
        />
        {/* Right branch (Alkalaemia) */}
        <line
          x1="50" y1="18"
          x2="75" y2="28"
          stroke={path.includes("alkalaemia") ? "hsl(var(--clinical-orange))" : "hsl(var(--border))"}
          strokeWidth="0.5"
          className="transition-colors duration-300"
        />
        {/* Acidaemia to Respiratory/Metabolic */}
        <line
          x1="20" y1="36"
          x2="15" y2="52"
          stroke={path.includes("respiratory_acidosis") ? "hsl(var(--clinical-blue))" : "hsl(var(--border))"}
          strokeWidth="0.5"
        />
        <line
          x1="30" y1="36"
          x2="35" y2="52"
          stroke={path.includes("metabolic_acidosis") ? "hsl(var(--clinical-orange))" : "hsl(var(--border))"}
          strokeWidth="0.5"
        />
        {/* Alkalaemia to Respiratory/Metabolic */}
        <line
          x1="70" y1="36"
          x2="65" y2="52"
          stroke={path.includes("respiratory_alkalosis") ? "hsl(var(--clinical-blue))" : "hsl(var(--border))"}
          strokeWidth="0.5"
        />
        <line
          x1="80" y1="36"
          x2="85" y2="52"
          stroke={path.includes("metabolic_alkalosis") ? "hsl(var(--clinical-green))" : "hsl(var(--border))"}
          strokeWidth="0.5"
        />
        {/* Anion Gap connection */}
        <line
          x1="35" y1="61"
          x2="35" y2="75"
          stroke={interpretation?.anionGap ? "hsl(var(--clinical-gray))" : "hsl(var(--border))"}
          strokeWidth="0.5"
          strokeDasharray="1"
        />
      </svg>

      {/* Acidaemia Node */}
      <FlowchartNode
        id="acidaemia"
        label="Acidaemia"
        type="decision"
        color="red"
        isActive={isNodeActive("acidaemia")}
        isComplete={isNodeComplete("acidaemia")}
        position={{ x: 25, y: 30 }}
      />

      {/* Alkalaemia Node */}
      <FlowchartNode
        id="alkalaemia"
        label="Alkalaemia"
        type="decision"
        color="orange"
        isActive={isNodeActive("alkalaemia")}
        isComplete={isNodeComplete("alkalaemia")}
        position={{ x: 75, y: 30 }}
      />

      {/* Disorder Nodes */}
      <FlowchartNode
        id="respiratory_acidosis"
        label="Respiratory Acidosis"
        type="result"
        color="blue"
        isActive={isNodeActive("respiratory_acidosis")}
        isComplete={isNodeComplete("respiratory_acidosis")}
        position={{ x: 15, y: 55 }}
      />

      <FlowchartNode
        id="metabolic_acidosis"
        label="Metabolic Acidosis"
        type="result"
        color="orange"
        isActive={isNodeActive("metabolic_acidosis")}
        isComplete={isNodeComplete("metabolic_acidosis")}
        position={{ x: 35, y: 55 }}
      />

      <FlowchartNode
        id="respiratory_alkalosis"
        label="Respiratory Alkalosis"
        type="result"
        color="blue"
        isActive={isNodeActive("respiratory_alkalosis")}
        isComplete={isNodeComplete("respiratory_alkalosis")}
        position={{ x: 65, y: 55 }}
      />

      <FlowchartNode
        id="metabolic_alkalosis"
        label="Metabolic Alkalosis"
        type="result"
        color="green"
        isActive={isNodeActive("metabolic_alkalosis")}
        isComplete={isNodeComplete("metabolic_alkalosis")}
        position={{ x: 85, y: 55 }}
      />

      <FlowchartNode
        id="anion_gap"
        label="Anion Gap Calculation"
        type="calculation"
        color="gray"
        isActive={currentStep === 3 && interpretation?.primaryDisorder === "metabolic_acidosis"}
        isComplete={interpretation?.anionGap !== undefined}
        position={{ x: 35, y: 80 }}
      />

      {/* AG status nodes */}
      {interpretation?.primaryDisorder === "metabolic_acidosis" && (
        <>
          <FlowchartNode
            id="ag_normal"
            label="Normal AG"
            type="result"
            color="green"
            isActive={interpretation?.anionGap?.status === "normal"}
            isComplete={interpretation?.anionGap?.status === "normal"}
            position={{ x: 20, y: 92 }}
          />
          <FlowchartNode
            id="ag_high"
            label="High AG"
            type="result"
            color="red"
            isActive={interpretation?.anionGap?.status === "high"}
            isComplete={interpretation?.anionGap?.status === "high"}
            position={{ x: 50, y: 92 }}
          />
        </>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex items-center gap-3 text-xs text-muted-foreground bg-background/80 rounded px-2 py-1">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-clinical-blue" />
          <span>Respiratory</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-clinical-orange" />
          <span>Metabolic</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-clinical-green" />
          <span>Normal</span>
        </div>
      </div>
    </div>
  );
}
