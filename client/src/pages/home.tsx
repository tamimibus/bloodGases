import { Activity, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardProvider, Wizard } from "@/components/blood-gas";
import { useTheme } from "@/components/theme-provider";

function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight">Blood Gas Interpreter</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Clinical ABG Analysis Tool
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          data-testid="button-theme-toggle"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <WizardProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <Wizard />
      </div>
    </WizardProvider>
  );
}
