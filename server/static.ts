import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const publicPath = path.join(__dirname, "public");  // dist/public

  if (!fs.existsSync(publicPath)) {
    throw new Error(`Could not find public: ${publicPath}`);
  }

  console.log(`Serving static from: ${publicPath}`);  // Should show dist/public

  app.use(express.static(publicPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}
