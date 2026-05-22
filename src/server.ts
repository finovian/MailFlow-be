import express from "express";
import cors from "cors";
import "dotenv/config";

import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { apiRouter } from "./routes/index.js";
import { inngestHandler } from "./inngest/index.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { createModuleLogger } from "./lib/logger.js";

const log = createModuleLogger("server");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/inngest", inngestHandler);

app.use("/api", apiRouter);


app.get("/health", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      status: "healthy",
      database: "connected",
      env: env.NODE_ENV,
    });
  } catch (error) {
    log.error({ error }, "Health check failed");

    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Global Error Handler
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  log.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown
const shutdown = async () => {
  log.info("Shutting down server...");
  server.close(async () => {
    log.info("Express server closed");
    await prisma.$disconnect();
    log.info("Database connection closed");
    process.exit(0);
  });

  // Force exit after 10s
  setTimeout(() => {
    log.error("Forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);