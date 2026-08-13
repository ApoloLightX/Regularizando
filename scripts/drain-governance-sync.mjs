import { drainGovernanceSyncQueue } from "../server/governance-sync.ts";

try {
  const result = await drainGovernanceSyncQueue(50);
  console.log(JSON.stringify({ ok: true, ...result }));
  process.exit(0);
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "GOVERNANCE_SYNC_FAILED" }));
  process.exit(1);
}
