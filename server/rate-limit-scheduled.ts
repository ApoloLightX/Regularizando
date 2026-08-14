import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { governanceSyncControls } from "../drizzle/schema";
import { cleanupExpiredRateLimitBuckets, getDb } from "./db";
import { sdk } from "./_core/sdk";

export async function runRateLimitCleanupSchedule(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) throw new Error("RATE_LIMIT_DATABASE_UNAVAILABLE");
    const control = (await db.select({ id: governanceSyncControls.id }).from(governanceSyncControls).where(and(eq(governanceSyncControls.controlKey, "rate-limit-cleanup"), eq(governanceSyncControls.scheduleCronTaskUid, user.taskUid))).limit(1))[0];
    if (!control) return res.json({ ok: true, skipped: "orphan" });
    const deleted = await cleanupExpiredRateLimitBuckets();
    return res.json({ ok: true, deleted, taskUid: user.taskUid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RATE_LIMIT_CLEANUP_FAILED";
    return res.status(500).json({ error: message, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}
