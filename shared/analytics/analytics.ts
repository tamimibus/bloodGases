// src/analytics.ts
import ReactGA from "react-ga4";

export const initGA = (measurementId: string | undefined): void => {
    if (!measurementId) {
        console.error("Measurement ID is not defined ==");
        return;
    }
    ReactGA.initialize(measurementId);
};

export const trackPageView = (path: string): void => {
    ReactGA.send({ hitType: "pageview", page: path });
};

export const trackStepView = (step: number, stepName: string): void => {
    ReactGA.send({
        hitType: "pageview",
        page: `step_${step}`,
        title: stepName
    });
};