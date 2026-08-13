import crypto from "node:crypto";
import mysql from "mysql2/promise";

const [milestoneType, sourceReference, summary, scopeJson = "{}"] = process.argv.slice(2);
const allowedTypes = new Set(["checkpoint", "publication", "security_review", "schema_change", "operational_review"]);

if (!allowedTypes.has(milestoneType) || !sourceReference || !summary) {
  console.error("Usage: pnpm tsx scripts/record-governance-milestone.mjs <type> <source-reference> <summary> [scope-json]");
  process.exit(1);
}

let scope;
try {
  scope = JSON.parse(scopeJson);
} catch {
  console.error("scope-json must be valid JSON");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const milestoneKey = `${milestoneType}:${sourceReference}`.slice(0, 128);
const connection = await mysql.createConnection(databaseUrl);
try {
  await connection.execute(
    `INSERT INTO governanceMilestones (milestoneId, milestoneKey, milestoneType, sourceReference, summary, scope, occurredAt)
     VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE milestoneKey = VALUES(milestoneKey)`,
    [crypto.randomUUID(), milestoneKey, milestoneType, sourceReference.slice(0, 180), summary.slice(0, 8000), JSON.stringify(scope)],
  );
  console.log(JSON.stringify({ ok: true, milestoneKey }));
} finally {
  await connection.end();
}
