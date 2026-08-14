import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { randomUUID } from "crypto";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { runGovernanceSyncSchedule } from "../governance-scheduled";
import { runRateLimitCleanupSchedule } from "../rate-limit-scheduled";
import { consumeRateLimitBucket } from "../db";
import { queueGovernanceEvent } from "../governance-sync";

const RATE_LIMITS = {
  trpc: { limit: 120, windowMs: 60_000, failClosed: false },
  upload: { limit: 12, windowMs: 60_000, failClosed: true },
  ai: { limit: 20, windowMs: 60_000, failClosed: true },
  admin: { limit: 60, windowMs: 60_000, failClosed: true },
} as const;

function resolveRateLimitPolicy(req: express.Request) {
  const path = req.path.toLowerCase();
  if (path.includes("evidences.upload")) return { scope: "upload", ...RATE_LIMITS.upload };
  if (path.includes("ai") || path.includes("analysis")) return { scope: "ai", ...RATE_LIMITS.ai };
  if (path.includes("datagovernance") || path.includes("leads")) return { scope: "admin", ...RATE_LIMITS.admin };
  return { scope: "trpc", ...RATE_LIMITS.trpc };
}

async function apiRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const policy = resolveRateLimitPolicy(req);
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  try {
    const bucket = await consumeRateLimitBucket({ bucketKey: `${policy.scope}:ip:${ip}`, scope: policy.scope, windowMs: policy.windowMs });
    if (bucket.requestCount > policy.limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.expiresAt.getTime() - Date.now()) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      console.warn("[rate-limit] blocked", { scope: policy.scope, ip, retryAfter });
      void queueGovernanceEvent({ sourceEventKey: `rate-limit:${randomUUID()}`, category: "cybersecurity", action: "RATE_LIMIT_BLOCKED", entityType: "rate_limit_bucket", metadata: { scope: policy.scope, retryAfter, criterion: "ip" } }).catch(error => console.warn("[rate-limit] audit deferred", error));
      return res.status(429).json({ error: "Muitas requisições; tente novamente em instantes." });
    }
    return next();
  } catch (error) {
    console.error("[rate-limit] bucket unavailable", { scope: policy.scope, failClosed: policy.failClosed, error });
    if (policy.failClosed) return res.status(503).json({ error: "Controle temporariamente indisponível para esta operação sensível." });
    return next();
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/governance-sync", runGovernanceSyncSchedule);
  app.post("/api/scheduled/rate-limit-cleanup", runRateLimitCleanupSchedule);
  // tRPC API
  app.use(
    "/api/trpc",
    apiRateLimit,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
