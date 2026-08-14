import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("rate limiting distribuído", () => {
  it("usa incremento atômico e expiração no banco compartilhado", () => {
    const db = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");
    expect(db).toContain("consumeRateLimitBucket");
    expect(db).toContain("ON DUPLICATE KEY UPDATE");
    expect(db).toContain("requestCount = IF(expiresAt <=");
    expect(db).toContain("cleanupExpiredRateLimitBuckets");
  });

  it("não conserva contador local e informa Retry-After em bloqueios HTTP", () => {
    const server = fs.readFileSync(path.join(root, "server", "_core", "index.ts"), "utf8");
    expect(server).not.toContain("apiWindows");
    expect(server).toContain("consumeRateLimitBucket");
    expect(server).toContain('res.setHeader("Retry-After"');
    expect(server).toContain("failClosed");
    expect(server).toContain('action: "RATE_LIMIT_BLOCKED"');
    expect(server).toContain('criterion: "ip"');
  });

  it("aplica bucket complementar por usuário antes de procedimentos protegidos", () => {
    const trpc = fs.readFileSync(path.join(root, "server", "_core", "trpc.ts"), "utf8");
    expect(trpc).toContain("authenticatedUserRateLimit");
    expect(trpc).toContain("trpc:user:");
    expect(trpc).toContain("trpc:org:");
    expect(trpc).toContain("getOrganizationForUser(user.id)");
    expect(trpc).toContain("protectedProcedure = t.procedure.use(requireUser).use(authenticatedUserRateLimit)");
  });

  it("limpa buckets expirados apenas por callback cron autenticado e vinculado", () => {
    const cleanup = fs.readFileSync(path.join(root, "server", "rate-limit-scheduled.ts"), "utf8");
    const server = fs.readFileSync(path.join(root, "server", "_core", "index.ts"), "utf8");
    expect(cleanup).toContain("user.isCron");
    expect(cleanup).toContain("rate-limit-cleanup");
    expect(cleanup).toContain("cleanupExpiredRateLimitBuckets");
    expect(server).toContain('app.post("/api/scheduled/rate-limit-cleanup"');
  });
});
