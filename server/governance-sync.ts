import { and, asc, eq, isNull, lte, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  governanceMilestones,
  governanceSyncControls,
  governanceSyncEvents,
} from "../drizzle/schema";
import { getDb, getOrganizationForUser } from "./db";

export type GovernanceCategory = "site" | "authentication" | "cybersecurity" | "lead" | "data_governance" | "release" | "integration" | "operational";
export type GovernanceMilestoneType = "checkpoint" | "publication" | "security_review" | "schema_change" | "operational_review";

const SENSITIVE_METADATA_KEYS = new Set([
  "email",
  "name",
  "token",
  "tokenhash",
  "password",
  "authorization",
  "cookie",
  "base64",
  "challenge",
  "filename",
  "fileurl",
  "filekey",
  "sourceexcerpt",
  "scopejustification",
  "rationale",
  "note",
]);

function normalizeMetadataValue(value: unknown, depth = 0): unknown {
  if (depth > 3 || value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.slice(0, 180);
  if (Array.isArray(value)) return value.slice(0, 12).map(item => normalizeMetadataValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SENSITIVE_METADATA_KEYS.has(key.toLowerCase()))
        .slice(0, 20)
        .map(([key, item]) => [key, normalizeMetadataValue(item, depth + 1)]),
    );
  }
  return null;
}

export function sanitizeGovernanceMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return normalizeMetadataValue(value) as Record<string, unknown>;
}

export function summarizeMutationInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { hasInput: Boolean(input) };
  return { inputFields: Object.keys(input as Record<string, unknown>).sort().slice(0, 30) };
}

export function classifyProcedureMutation(path: string): { category: GovernanceCategory; action: string; entityType: string } {
  if (path === "pilot.request") return { category: "lead", action: "LEAD_CAPTURED", entityType: "pilot_request" };
  if (path.startsWith("leads.")) return { category: "lead", action: "LEAD_LIFECYCLE_CHANGED", entityType: "pilot_request" };
  if (path.startsWith("auth.") || path.startsWith("invitations.") || path.startsWith("team.")) return { category: "authentication", action: "IDENTITY_OR_ACCESS_CHANGED", entityType: "access_control" };
  if (path.startsWith("evidences.") || path.startsWith("reviews.")) return { category: "cybersecurity", action: "EVIDENCE_ACCESS_OR_REVIEW", entityType: "evidence_governance" };
  if (path.startsWith("sites.")) return { category: "site", action: "SITE_OPERATION_CHANGED", entityType: "site" };
  if (path.startsWith("organization.") || path.startsWith("obligations.")) return { category: "data_governance", action: "GOVERNANCE_WORKFLOW_CHANGED", entityType: "compliance_governance" };
  return { category: "operational", action: "OPERATIONAL_WORKFLOW_CHANGED", entityType: "application_workflow" };
}

function retryAt(attempt: number) {
  const minutes = Math.min(60 * 24, Math.max(1, 2 ** Math.min(attempt, 10)));
  return new Date(Date.now() + minutes * 60_000);
}

function parseMetadata(metadata: string | null) {
  if (!metadata) return {};
  try {
    return sanitizeGovernanceMetadata(JSON.parse(metadata));
  } catch {
    return {};
  }
}

function getSupabaseConfig() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceRoleKey) return null;
  return { baseUrl, serviceRoleKey };
}

async function postToSupabase(table: string, payload: unknown) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("SUPABASE_SYNC_NOT_CONFIGURED");
  const response = await fetch(`${config.baseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`SUPABASE_HTTP_${response.status}`);
}

export async function queueGovernanceEvent(input: {
  sourceEventKey: string;
  category: GovernanceCategory;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  organizationId?: number | null;
  actorUserId?: number | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  const eventId = randomUUID();
  const row = {
    eventId,
    sourceEventKey: input.sourceEventKey,
    category: input.category,
    action: input.action.slice(0, 120),
    entityType: input.entityType.slice(0, 96),
    entityId: input.entityId === undefined || input.entityId === null ? null : String(input.entityId).slice(0, 96),
    organizationId: input.organizationId ?? null,
    actorUserId: input.actorUserId ?? null,
    metadata: JSON.stringify(sanitizeGovernanceMetadata(input.metadata ?? {})),
    occurredAt: input.occurredAt ?? new Date(),
  };
  await db.insert(governanceSyncEvents).values(row).onDuplicateKeyUpdate({ set: { sourceEventKey: row.sourceEventKey } });
  const queued = (await db.select().from(governanceSyncEvents).where(eq(governanceSyncEvents.sourceEventKey, row.sourceEventKey)).limit(1))[0];
  return queued ?? null;
}

export async function queueGovernanceMilestone(input: {
  milestoneKey: string;
  milestoneType: GovernanceMilestoneType;
  sourceReference: string;
  summary: string;
  scope?: Record<string, unknown>;
  occurredAt?: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  const row = {
    milestoneId: randomUUID(),
    milestoneKey: input.milestoneKey,
    milestoneType: input.milestoneType,
    sourceReference: input.sourceReference.slice(0, 180),
    summary: input.summary.slice(0, 8_000),
    scope: JSON.stringify(sanitizeGovernanceMetadata(input.scope ?? {})),
    occurredAt: input.occurredAt ?? new Date(),
  };
  await db.insert(governanceMilestones).values(row).onDuplicateKeyUpdate({ set: { milestoneKey: row.milestoneKey } });
  return (await db.select().from(governanceMilestones).where(eq(governanceMilestones.milestoneKey, row.milestoneKey)).limit(1))[0] ?? null;
}

async function markEventSynced(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(governanceSyncEvents).set({ syncStatus: "synced", syncedAt: new Date(), nextAttemptAt: null, lastErrorCode: null }).where(eq(governanceSyncEvents.id, id));
}

async function markEventFailed(id: number, attempts: number, error: unknown) {
  const db = await getDb();
  if (!db) return;
  const errorCode = error instanceof Error ? error.message.slice(0, 120) : "SUPABASE_SYNC_FAILED";
  await db.update(governanceSyncEvents).set({ syncStatus: "failed", syncAttempts: attempts + 1, nextAttemptAt: retryAt(attempts + 1), lastErrorCode: errorCode }).where(eq(governanceSyncEvents.id, id));
}

async function markMilestoneSynced(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(governanceMilestones).set({ syncStatus: "synced", syncedAt: new Date(), nextAttemptAt: null, lastErrorCode: null }).where(eq(governanceMilestones.id, id));
}

async function markMilestoneFailed(id: number, attempts: number, error: unknown) {
  const db = await getDb();
  if (!db) return;
  const errorCode = error instanceof Error ? error.message.slice(0, 120) : "SUPABASE_SYNC_FAILED";
  await db.update(governanceMilestones).set({ syncStatus: "failed", syncAttempts: attempts + 1, nextAttemptAt: retryAt(attempts + 1), lastErrorCode: errorCode }).where(eq(governanceMilestones.id, id));
}

export async function drainGovernanceSyncQueue(limit = 20) {
  const db = await getDb();
  if (!db) return { events: 0, milestones: 0, skipped: true };
  const now = new Date();
  const [events, milestones] = await Promise.all([
    db.select().from(governanceSyncEvents).where(and(or(eq(governanceSyncEvents.syncStatus, "pending"), eq(governanceSyncEvents.syncStatus, "failed")), or(isNull(governanceSyncEvents.nextAttemptAt), lte(governanceSyncEvents.nextAttemptAt, now)))).orderBy(asc(governanceSyncEvents.createdAt)).limit(limit),
    db.select().from(governanceMilestones).where(and(or(eq(governanceMilestones.syncStatus, "pending"), eq(governanceMilestones.syncStatus, "failed")), or(isNull(governanceMilestones.nextAttemptAt), lte(governanceMilestones.nextAttemptAt, now)))).orderBy(asc(governanceMilestones.createdAt)).limit(limit),
  ]);
  let syncedEvents = 0;
  let syncedMilestones = 0;
  for (const event of events) {
    try {
      await postToSupabase("regularizando_governance_events", {
        id: event.eventId,
        source_event_id: event.sourceEventKey,
        category: event.category,
        action: event.action,
        entity_type: event.entityType,
        entity_id: event.entityId,
        organization_ref: event.organizationId ? `organization:${event.organizationId}` : null,
        actor_ref: event.actorUserId ? `user:${event.actorUserId}` : null,
        metadata: parseMetadata(event.metadata),
        occurred_at: event.occurredAt.toISOString(),
      });
      await markEventSynced(event.id);
      syncedEvents += 1;
    } catch (error) {
      await markEventFailed(event.id, event.syncAttempts, error);
    }
  }
  for (const milestone of milestones) {
    try {
      await postToSupabase("regularizando_governance_milestones", {
        id: milestone.milestoneId,
        milestone_key: milestone.milestoneKey,
        milestone_type: milestone.milestoneType,
        source_reference: milestone.sourceReference,
        summary: milestone.summary,
        scope: parseMetadata(milestone.scope),
        occurred_at: milestone.occurredAt.toISOString(),
      });
      await markMilestoneSynced(milestone.id);
      syncedMilestones += 1;
    } catch (error) {
      await markMilestoneFailed(milestone.id, milestone.syncAttempts, error);
    }
  }
  return { events: syncedEvents, milestones: syncedMilestones, skipped: false };
}

export async function hasGovernanceSyncTask(taskUid: string) {
  const db = await getDb();
  if (!db) return false;
  const control = (await db.select({ id: governanceSyncControls.id }).from(governanceSyncControls).where(and(eq(governanceSyncControls.controlKey, "supabase-governance-sync"), eq(governanceSyncControls.scheduleCronTaskUid, taskUid))).limit(1))[0];
  return Boolean(control);
}

export async function recordProcedureMutation(input: { path: string; actorUserId?: number | null; procedureInput?: unknown }) {
  const classification = classifyProcedureMutation(input.path);
  const organization = input.actorUserId ? await getOrganizationForUser(input.actorUserId) : undefined;
  const event = await queueGovernanceEvent({
    sourceEventKey: `trpc:${randomUUID()}`,
    category: classification.category,
    action: classification.action,
    entityType: classification.entityType,
    entityId: input.path,
    organizationId: organization?.organization.id ?? null,
    actorUserId: input.actorUserId ?? null,
    metadata: { procedure: input.path, ...summarizeMutationInput(input.procedureInput) },
  });
  try {
    await drainGovernanceSyncQueue(5);
  } catch (error) {
    console.warn("[governance-sync] deferred replica", error instanceof Error ? error.message : error);
  }
  return event;
}
