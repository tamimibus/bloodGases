// src/AnalyticsTracker.tsx
import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { trackPageView } from "./analytics";

const AnalyticsTracker: React.FC = () => {
    const [location] = useLocation();

    useEffect(() => {
        trackPageView(location);
    }, [location]);

    return null;
};

export default AnalyticsTracker;