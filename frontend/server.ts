import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes

  // List all tickers in the reports directory
  app.get("/api/reports/tickers", async (req, res) => {
    try {
      const reportsPath = path.join(process.cwd(), "analytics", "reports");
      const entries = await fs.readdir(reportsPath, { withFileTypes: true });
      const tickers = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
      res.json(tickers);
    } catch (error) {
      console.error("Error listing tickers:", error);
      res.status(500).json({ error: "Failed to list tickers" });
    }
  });

  // Get latest report for all tickers at once
  app.get("/api/reports/latest", async (req, res) => {
    try {
      const reportsPath = path.join(process.cwd(), "analytics", "reports");
      const entries = await fs.readdir(reportsPath, { withFileTypes: true });
      const tickers = entries.filter((e) => e.isDirectory()).map((e) => e.name);

      const results = await Promise.all(
        tickers.map(async (ticker) => {
          try {
            const tickerPath = path.join(reportsPath, ticker);
            const files = await fs.readdir(tickerPath);
            const latest = files
              .filter((f) => f.endsWith(".json"))
              .sort()
              .reverse()[0];
            if (!latest) return null;
            const content = await fs.readFile(
              path.join(tickerPath, latest),
              "utf-8",
            );
            return JSON.parse(content);
          } catch {
            return null;
          }
        }),
      );

      res.json(results.filter(Boolean));
    } catch (error) {
      console.error("Error fetching latest reports:", error);
      res.status(500).json({ error: "Failed to fetch latest reports" });
    }
  });

  // List all dates for a specific ticker
  app.get("/api/reports/:ticker/dates", async (req, res) => {
    const { ticker } = req.params;
    try {
      const tickerPath = path.join(
        process.cwd(),
        "analytics",
        "reports",
        ticker,
      );
      const entries = await fs.readdir(tickerPath, { withFileTypes: true });
      const dates = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name.replace(".json", ""));
      res.json(dates);
    } catch (error) {
      console.error(`Error listing dates for ${ticker}:`, error);
      res.status(500).json({ error: "Failed to list dates" });
    }
  });

  // Get report data for a specific ticker and date
  app.get("/api/reports/:ticker/:date", async (req, res) => {
    const { ticker, date } = req.params;
    try {
      const reportPath = path.join(
        process.cwd(),
        "analytics",
        "reports",
        ticker,
        `${date}.json`,
      );
      const content = await fs.readFile(reportPath, "utf-8");
      res.json(JSON.parse(content));
    } catch (error) {
      console.error(`Error reading report for ${ticker} on ${date}:`, error);
      res.status(404).json({ error: "Report not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: path.join(process.cwd(), "frontend", "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "frontend"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
