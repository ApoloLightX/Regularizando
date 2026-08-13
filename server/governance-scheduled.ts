import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { drainGovernanceSyncQueue, hasGovernanceSyncTask } from "./governance-sync";

export async function runGovernanceSyncSchedule(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    if (!(await hasGovernanceSyncTask(user.taskUid))) return res.json({ ok: true, skipped: "orphan" });
    const result = await drainGovernanceSyncQueue(50);
    return res.json({ ok: true, ...result, taskUid: user.taskUid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GOVERNANCE_SYNC_FAILED";
    return res.status(500).json({ error: message, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}
