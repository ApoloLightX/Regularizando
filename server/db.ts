import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditEvents,
  capaActions,
  conditions,
  evidences,
  esgMetrics,
  incidents,
  InsertUser,
  licenses,
  organizationInvites,
  organizationMembers,
  organizations,
  pilotRequests,
  reviewRequests,
  sites,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { canDecideAssignedReview, rejectCrossTenantReference } from "./regularizando.policy";

let database: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) database = drizzle(process.env.DATABASE_URL);
  return database;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: new Date(), role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user") };
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: new Date() } });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function getOrganizationForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select({ organization: organizations, membership: organizationMembers }).from(organizationMembers).innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id)).where(eq(organizationMembers.userId, userId)).orderBy(desc(organizationMembers.createdAt)).limit(1))[0];
}

export async function createOrganizationForUser(input: { name: string; slug: string; sector: "telecom" | "infraestrutura" | "industria" | "consultoria" | "outro"; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  return db.transaction(async (tx) => {
    const result = await tx.insert(organizations).values({ name: input.name, slug: input.slug, sector: input.sector });
    const organizationId = Number(result[0].insertId);
    await tx.insert(organizationMembers).values({ organizationId, userId: input.userId, role: "owner" });
    return (await tx.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1))[0];
  });
}

export async function createPilotRequest(input: typeof pilotRequests.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.insert(pilotRequests).values(input);
  return Number(result[0].insertId);
}

export async function getDashboardData(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const [siteRows, licenseRows, conditionRows, capaRows, incidentRows, metricRows, evidenceRows, reviewRows] = await Promise.all([
    db.select().from(sites).where(eq(sites.organizationId, organizationId)).orderBy(desc(sites.updatedAt)),
    db.select().from(licenses).where(eq(licenses.organizationId, organizationId)).orderBy(desc(licenses.expiryDate)),
    db.select().from(conditions).where(eq(conditions.organizationId, organizationId)).orderBy(desc(conditions.dueDate)),
    db.select().from(capaActions).where(eq(capaActions.organizationId, organizationId)).orderBy(desc(capaActions.dueDate)),
    db.select().from(incidents).where(eq(incidents.organizationId, organizationId)).orderBy(desc(incidents.occurredAt)),
    db.select().from(esgMetrics).where(eq(esgMetrics.organizationId, organizationId)).orderBy(desc(esgMetrics.updatedAt)),
    db.select().from(evidences).where(eq(evidences.organizationId, organizationId)).orderBy(desc(evidences.createdAt)),
    db.select().from(reviewRequests).where(eq(reviewRequests.organizationId, organizationId)).orderBy(desc(reviewRequests.createdAt)),
  ]);
  const dueSoon = licenseRows.filter((item) => item.expiryDate && item.expiryDate.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 90 && item.expiryDate.getTime() >= Date.now()).length;
  const overdueConditions = conditionRows.filter((item) => item.status === "atrasada" || item.evidenceStatus === "ausente").length;
  return {
    sites: siteRows, licenses: licenseRows, conditions: conditionRows, capas: capaRows, incidents: incidentRows, metrics: metricRows, evidences: evidenceRows, reviewRequests: reviewRows,
    summary: { totalSites: siteRows.length, licensesDueSoon: dueSoon, overdueConditions, openCapas: capaRows.filter((item) => item.status !== "concluida").length, openIncidents: incidentRows.filter((item) => item.status !== "encerrado").length, verifiedMetrics: metricRows.filter((item) => item.status === "verificado").length, totalMetrics: metricRows.length, evidenceCoverage: conditionRows.length ? Math.round((conditionRows.filter((item) => item.evidenceStatus === "verificada").length / conditionRows.length) * 100) : 0 },
  };
}

export type OwnedEntityType = "site" | "licenca" | "condicionante" | "capa" | "incidente" | "esg";

/** Rejeita referências de outro tenant, mesmo quando um ID existente é enviado pelo cliente. */
export async function assertEntityBelongsToOrganization(organizationId: number, entityType: OwnedEntityType, entityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  let found: { id: number }[];
  if (entityType === "site") found = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.id, entityId), eq(sites.organizationId, organizationId))).limit(1);
  else if (entityType === "licenca") found = await db.select({ id: licenses.id }).from(licenses).where(and(eq(licenses.id, entityId), eq(licenses.organizationId, organizationId))).limit(1);
  else if (entityType === "condicionante") found = await db.select({ id: conditions.id }).from(conditions).where(and(eq(conditions.id, entityId), eq(conditions.organizationId, organizationId))).limit(1);
  else if (entityType === "capa") found = await db.select({ id: capaActions.id }).from(capaActions).where(and(eq(capaActions.id, entityId), eq(capaActions.organizationId, organizationId))).limit(1);
  else if (entityType === "incidente") found = await db.select({ id: incidents.id }).from(incidents).where(and(eq(incidents.id, entityId), eq(incidents.organizationId, organizationId))).limit(1);
  else found = await db.select({ id: esgMetrics.id }).from(esgMetrics).where(and(eq(esgMetrics.id, entityId), eq(esgMetrics.organizationId, organizationId))).limit(1);
  rejectCrossTenantReference(Boolean(found[0]));
}

export async function createSite(input: typeof sites.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(sites).values(input))[0].insertId); }
export async function createLicense(input: typeof licenses.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(licenses).values(input))[0].insertId); }
export async function createCondition(input: typeof conditions.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(conditions).values(input))[0].insertId); }
export async function createCapaAction(input: typeof capaActions.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(capaActions).values(input))[0].insertId); }
export async function createIncident(input: typeof incidents.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(incidents).values(input))[0].insertId); }
export async function createEsgMetric(input: typeof esgMetrics.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(esgMetrics).values(input).onDuplicateKeyUpdate({ set: { value: input.value, target: input.target, unit: input.unit, sourceDescription: input.sourceDescription, status: input.status } }))[0].insertId); }
export async function createEvidence(input: typeof evidences.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(evidences).values(input))[0].insertId); }
export async function getEvidenceForOrganization(evidenceId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const evidence = (await db.select().from(evidences).where(and(eq(evidences.id, evidenceId), eq(evidences.organizationId, organizationId))).limit(1))[0];
  if (!evidence) throw new Error("A evidência não pertence à organização atual.");
  return evidence;
}
export async function createAuditEvent(input: typeof auditEvents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  return Number((await db.insert(auditEvents).values(input))[0].insertId);
}
export async function createReviewRequest(input: typeof reviewRequests.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(reviewRequests).values(input))[0].insertId); }

export async function decideReviewRequest(input: { reviewId: number; organizationId: number; reviewerUserId: number; status: "aprovada" | "rejeitada"; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const review = (await db.select().from(reviewRequests).where(and(eq(reviewRequests.id, input.reviewId), eq(reviewRequests.organizationId, input.organizationId))).limit(1))[0];
  if (!review || review.status !== "pendente") throw new Error("A solicitação de revisão não está disponível.");
  if (!canDecideAssignedReview(review.reviewerUserId, input.reviewerUserId)) throw new Error("Esta aprovação está atribuída a outro revisor.");
  await db.transaction(async (tx) => {
    await tx.update(reviewRequests).set({ status: input.status, note: input.note ?? null, reviewerUserId: input.reviewerUserId, reviewedAt: new Date() }).where(eq(reviewRequests.id, input.reviewId));
    await tx.update(evidences).set({ reviewStatus: input.status === "aprovada" ? "verificada" : "rejeitada" }).where(and(eq(evidences.id, review.evidenceId), eq(evidences.organizationId, input.organizationId)));
  });
}

export async function getTeamOverview(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const [members, invites] = await Promise.all([
    db.select({ membership: organizationMembers, user: { id: users.id, name: users.name, email: users.email } }).from(organizationMembers).innerJoin(users, eq(organizationMembers.userId, users.id)).where(eq(organizationMembers.organizationId, organizationId)).orderBy(desc(organizationMembers.createdAt)),
    db.select().from(organizationInvites).where(eq(organizationInvites.organizationId, organizationId)).orderBy(desc(organizationInvites.createdAt)),
  ]);
  return { members, invites };
}

export async function getMemberOfOrganization(organizationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  return (await db.select().from(organizationMembers).where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId))).limit(1))[0];
}

export async function getMemberOfOrganizationByEmail(organizationId: number, email: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  return (await db.select({ membership: organizationMembers, user: users }).from(organizationMembers).innerJoin(users, eq(organizationMembers.userId, users.id)).where(and(eq(organizationMembers.organizationId, organizationId), eq(users.email, email))).limit(1))[0];
}

export async function createOrganizationInvite(input: typeof organizationInvites.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  return Number((await db.insert(organizationInvites).values(input))[0].insertId);
}

export async function getInviteByHash(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  return (await db.select({ invite: organizationInvites, organization: organizations }).from(organizationInvites).innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id)).where(eq(organizationInvites.tokenHash, tokenHash)).limit(1))[0];
}

export async function revokeOrganizationInvite(input: { inviteId: number; organizationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.update(organizationInvites).set({ status: "revogado" }).where(and(eq(organizationInvites.id, input.inviteId), eq(organizationInvites.organizationId, input.organizationId), eq(organizationInvites.status, "pendente")));
  if (result[0].affectedRows !== 1) throw new Error("O convite não está disponível para revogação.");
}

export async function acceptOrganizationInvite(input: { tokenHash: string; userId: number; email: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const item = await getInviteByHash(input.tokenHash);
  if (!item) throw new Error("Convite inválido.");
  if (item.invite.status !== "pendente" || item.invite.expiresAt.getTime() < Date.now()) throw new Error("Este convite expirou ou já não está disponível.");
  if (item.invite.email !== input.email) throw new Error("Este convite foi emitido para outro e-mail.");
  await db.transaction(async (tx) => {
    await tx.insert(organizationMembers).values({ organizationId: item.invite.organizationId, userId: input.userId, role: item.invite.role }).onDuplicateKeyUpdate({ set: { role: item.invite.role } });
    await tx.update(organizationInvites).set({ status: "aceito", acceptedByUserId: input.userId, acceptedAt: new Date() }).where(eq(organizationInvites.id, item.invite.id));
  });
  return item.organization;
}

export async function assignCapaResponsible(input: { capaId: number; organizationId: number; responsibleUserId: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  if (input.responsibleUserId) {
    const member = await getMemberOfOrganization(input.organizationId, input.responsibleUserId);
    if (!member) throw new Error("O responsável precisa ser membro da organização.");
  }
  const result = await db.update(capaActions).set({ responsibleUserId: input.responsibleUserId }).where(and(eq(capaActions.id, input.capaId), eq(capaActions.organizationId, input.organizationId)));
  if (result[0].affectedRows !== 1) throw new Error("A CAPA não pertence à organização atual.");
}

export async function assignReviewResponsible(input: { reviewId: number; organizationId: number; reviewerUserId: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  if (input.reviewerUserId) {
    const member = await getMemberOfOrganization(input.organizationId, input.reviewerUserId);
    if (!member || !["owner", "admin", "reviewer"].includes(member.role)) throw new Error("Selecione um membro com permissão de revisão.");
  }
  const result = await db.update(reviewRequests).set({ reviewerUserId: input.reviewerUserId }).where(and(eq(reviewRequests.id, input.reviewId), eq(reviewRequests.organizationId, input.organizationId), eq(reviewRequests.status, "pendente")));
  if (result[0].affectedRows !== 1) throw new Error("A aprovação não está disponível para atribuição.");
}
