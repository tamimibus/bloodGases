import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  bloodGasInputSchema,
  type AnionGapStatus,
  type Chronicity,
  type PrimaryDisorder,
} from "@shared/schema";
import {
  calculateAnionGap,
  calculateOsmolarGap,
  calculateWintersFormula,
  calculateDeltaRatio,
  getCausesForDisorder,
  interpretBloodGas,
} from "@shared/blood-gas-calculations";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/interpret", (req, res) => {
    try {
      const validatedInput = bloodGasInputSchema.parse(req.body);
      const interpretation = interpretBloodGas(validatedInput);

      if (!interpretation) {
        return res.status(400).json({
          error: "Insufficient data for interpretation. pH, pCO2, and HCO3 are required.",
        });
      }

      res.json(interpretation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input data",
          details: error.errors,
        });
      }
      console.error("Interpretation error:", error);
      res.status(500).json({ error: "Failed to interpret blood gas values" });
    }
  });

  app.post("/api/calculate/anion-gap", (req, res) => {
    try {
      const schema = z.object({
        Na: z.number(),
        Cl: z.number(),
        HCO3: z.number(),
        albumin: z.number().optional(),
      });

      const { Na, Cl, HCO3, albumin } = schema.parse(req.body);
      const result = calculateAnionGap(Na, Cl, HCO3, albumin);

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input data",
          details: error.errors,
        });
      }
      res.status(500).json({ error: "Failed to calculate anion gap" });
    }
  });

  app.post("/api/calculate/osmolar-gap", (req, res) => {
    try {
      const schema = z.object({
        measuredOsmolality: z.number(),
        Na: z.number(),
        glucose: z.number(),
        urea: z.number(),
        ethanol: z.number().optional(),
      });

      const { measuredOsmolality, Na, glucose, urea, ethanol } = schema.parse(req.body);
      const result = calculateOsmolarGap(measuredOsmolality, Na, glucose, urea, ethanol);

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input data",
          details: error.errors,
        });
      }
      res.status(500).json({ error: "Failed to calculate osmolar gap" });
    }
  });

  app.post("/api/calculate/winters", (req, res) => {
    try {
      const schema = z.object({
        HCO3: z.number(),
        pCO2: z.number(),
      });

      const { HCO3, pCO2 } = schema.parse(req.body);
      const result = calculateWintersFormula(HCO3, pCO2);

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input data",
          details: error.errors,
        });
      }
      res.status(500).json({ error: "Failed to calculate Winter's formula" });
    }
  });

  app.post("/api/calculate/delta-ratio", (req, res) => {
    try {
      const schema = z.object({
        anionGap: z.number(),
        HCO3: z.number(),
      });

      const { anionGap, HCO3 } = schema.parse(req.body);
      const result = calculateDeltaRatio(anionGap, HCO3);

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input data",
          details: error.errors,
        });
      }
      res.status(500).json({ error: "Failed to calculate delta ratio" });
    }
  });

  app.get("/api/causes/:disorder", (req, res) => {
    const { disorder } = req.params;
    const { anionGapStatus, chronicity } = req.query;

    const validDisorders = [
      "respiratory_acidosis",
      "metabolic_acidosis",
      "respiratory_alkalosis",
      "metabolic_alkalosis",
    ];

    if (!validDisorders.includes(disorder)) {
      return res.status(400).json({ error: "Invalid disorder type" });
    }

    const causes = getCausesForDisorder(
      disorder as PrimaryDisorder,
      anionGapStatus as AnionGapStatus | undefined,
      chronicity as Chronicity | undefined
    );

    res.json({ causes });
  });

  return httpServer;
}
