import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import ReactGA from "react-ga4";
import { useEffect } from "react";
import { initGA } from "@shared/analytics/analytics";
import AnalyticsTracker from "@shared/analytics/AnalyticsTracker";

function Router() {
  return (
    <>
      <AnalyticsTracker />
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch></>

  );
}

function App() {
  useEffect(() => {
    const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID
    initGA(measurementId);
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="blood-gas-theme">

      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>

    </ThemeProvider>
  );
}

export default App;
