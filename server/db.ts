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
  obligationDecisions,
  obligationEvidenceLinks,
  obligationInstances,
  officialSourceCatalog,
  organizationInvites,
  organizationMembers,
  organizationOnboarding,
  organizationOfficialSourceImports,
  organizations,
  pilotRequests,
  requirementSources,
  requirementSourceConflicts,
  requirements,
  requirementVersions,
  reviewRequests,
  sectorProfiles,
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

export async function getPilotRequests() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  return db.select().from(pilotRequests).orderBy(desc(pilotRequests.createdAt));
}

export async function qualifyPilotRequest(input: {
  pilotRequestId: number;
  qualificationStage: "mql" | "sql" | "disqualified" | "converted";
  qualifiedByUserId: number;
  qualificationNote?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const previous = (await db.select().from(pilotRequests).where(eq(pilotRequests.id, input.pilotRequestId)).limit(1))[0];
  if (!previous) throw new Error("A solicitação de piloto não foi encontrada.");
  const result = await db.update(pilotRequests).set({ qualificationStage: input.qualificationStage, qualifiedByUserId: input.qualifiedByUserId, qualifiedAt: new Date(), qualificationNote: input.qualificationNote ?? null }).where(eq(pilotRequests.id, input.pilotRequestId));
  if (result[0].affectedRows !== 1) throw new Error("A solicitação de piloto não foi encontrada.");
  const lead = (await db.select().from(pilotRequests).where(eq(pilotRequests.id, input.pilotRequestId)).limit(1))[0];
  if (!lead) throw new Error("A solicitação de piloto não foi encontrada após a atualização.");
  return { lead, previousStage: previous.qualificationStage };
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

export async function getObligationOverview(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const [profiles, sources, requirementRows, versionRows, obligations, evidenceLinks, evidenceRows, reviews, decisions, conflicts, onboardingRows, catalog, catalogImports] = await Promise.all([
    db.select().from(sectorProfiles).where(eq(sectorProfiles.organizationId, organizationId)).orderBy(desc(sectorProfiles.updatedAt)),
    db.select().from(requirementSources).where(eq(requirementSources.organizationId, organizationId)).orderBy(desc(requirementSources.updatedAt)),
    db.select().from(requirements).where(eq(requirements.organizationId, organizationId)).orderBy(desc(requirements.updatedAt)),
    db.select().from(requirementVersions).where(eq(requirementVersions.organizationId, organizationId)).orderBy(desc(requirementVersions.updatedAt)),
    db.select().from(obligationInstances).where(eq(obligationInstances.organizationId, organizationId)).orderBy(desc(obligationInstances.dueDate)),
    db.select().from(obligationEvidenceLinks).where(eq(obligationEvidenceLinks.organizationId, organizationId)).orderBy(desc(obligationEvidenceLinks.createdAt)),
    db.select().from(evidences).where(eq(evidences.organizationId, organizationId)).orderBy(desc(evidences.createdAt)),
    db.select().from(reviewRequests).where(eq(reviewRequests.organizationId, organizationId)).orderBy(desc(reviewRequests.createdAt)),
    db.select().from(obligationDecisions).where(eq(obligationDecisions.organizationId, organizationId)).orderBy(desc(obligationDecisions.decidedAt)),
    db.select().from(requirementSourceConflicts).where(eq(requirementSourceConflicts.organizationId, organizationId)).orderBy(desc(requirementSourceConflicts.updatedAt)),
    db.select().from(organizationOnboarding).where(eq(organizationOnboarding.organizationId, organizationId)).limit(1),
    db.select().from(officialSourceCatalog).where(eq(officialSourceCatalog.validationStatus, "verificada")).orderBy(officialSourceCatalog.identifier),
    db.select().from(organizationOfficialSourceImports).where(eq(organizationOfficialSourceImports.organizationId, organizationId)).orderBy(desc(organizationOfficialSourceImports.updatedAt)),
  ]);
  return { profiles, sources, requirements: requirementRows, versions: versionRows, obligations, evidenceLinks, evidences: evidenceRows, reviews, decisions, conflicts, onboarding: onboardingRows[0] ?? null, catalog, catalogImports };
}

export function deriveObligationEvidenceStatus(statuses: Array<"enviada" | "verificada" | "rejeitada">): "ausente" | "enviada" | "verificada" | "rejeitada" {
  if (statuses.length === 0) return "ausente";
  if (statuses.every((status) => status === "verificada")) return "verificada";
  if (statuses.some((status) => status === "enviada")) return "enviada";
  return "rejeitada";
}

export async function syncObligationEvidenceStatus(obligationId: number, organizationId: number) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const rows = await db.select({ reviewStatus: evidences.reviewStatus }).from(obligationEvidenceLinks).innerJoin(evidences, eq(obligationEvidenceLinks.evidenceId, evidences.id)).where(and(eq(obligationEvidenceLinks.obligationId, obligationId), eq(obligationEvidenceLinks.organizationId, organizationId), eq(evidences.organizationId, organizationId)));
  const evidenceStatus = deriveObligationEvidenceStatus(rows.map((row) => row.reviewStatus));
  await db.update(obligationInstances).set({ evidenceStatus }).where(and(eq(obligationInstances.id, obligationId), eq(obligationInstances.organizationId, organizationId)));
  return evidenceStatus;
}

export async function createSectorProfile(input: typeof sectorProfiles.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(sectorProfiles).values(input))[0].insertId); }
export async function activateSectorProfile(input: { profileId: number; organizationId: number }) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); const result = await db.update(sectorProfiles).set({ status: "ativo" }).where(and(eq(sectorProfiles.id, input.profileId), eq(sectorProfiles.organizationId, input.organizationId))); if (result[0].affectedRows !== 1) throw new Error("O perfil setorial não pertence à organização atual."); }
export async function getSectorProfileForOrganization(profileId: number, organizationId: number) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); const profile = (await db.select().from(sectorProfiles).where(and(eq(sectorProfiles.id, profileId), eq(sectorProfiles.organizationId, organizationId))).limit(1))[0]; if (!profile) throw new Error("O perfil setorial não pertence à organização atual."); return profile; }
export async function createRequirementSource(input: typeof requirementSources.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  validateRequirementSourceProvenance(input);
  return Number((await db.insert(requirementSources).values(input))[0].insertId);
}

export async function getOfficialSourceCatalog() {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  return db.select().from(officialSourceCatalog).where(eq(officialSourceCatalog.validationStatus, "verificada")).orderBy(officialSourceCatalog.identifier);
}

export function buildImportedOfficialSource(catalog: Pick<typeof officialSourceCatalog.$inferSelect, "title" | "issuer" | "sourceType" | "jurisdiction" | "authorityLevel" | "identifier" | "sourceVersionLabel" | "sourceUrl" | "publicationDate" | "effectiveFrom" | "effectiveTo">, input: { organizationId: number; importedByUserId: number }) {
  return { organizationId: input.organizationId, title: catalog.title, issuer: catalog.issuer, sourceType: catalog.sourceType === "norma" ? "norma" as const : "orientacao_tecnica" as const, jurisdiction: catalog.jurisdiction, authorityLevel: catalog.authorityLevel, officialOriginStatus: "oficial" as const, identifier: catalog.identifier, sourceVersionLabel: catalog.sourceVersionLabel, sourceUrl: catalog.sourceUrl, publicationDate: catalog.publicationDate, effectiveFrom: catalog.effectiveFrom, effectiveTo: catalog.effectiveTo, verificationStatus: "em_revisao" as const, createdByUserId: input.importedByUserId };
}

export async function importOfficialSourceToOrganization(input: { catalogSourceId: number; organizationId: number; importedByUserId: number; scopeConfirmation: string }) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  return db.transaction(async (tx) => {
    const catalog = (await tx.select().from(officialSourceCatalog).where(and(eq(officialSourceCatalog.id, input.catalogSourceId), eq(officialSourceCatalog.validationStatus, "verificada"))).limit(1))[0];
    if (!catalog) throw new Error("A fonte oficial não está disponível para importação.");
    const existing = (await tx.select().from(organizationOfficialSourceImports).where(and(eq(organizationOfficialSourceImports.organizationId, input.organizationId), eq(organizationOfficialSourceImports.catalogSourceId, input.catalogSourceId))).limit(1))[0];
    if (existing) throw new Error("Esta fonte já foi importada pela organização atual.");
    const sourceResult = await tx.insert(requirementSources).values(buildImportedOfficialSource(catalog, input));
    const requirementSourceId = Number(sourceResult[0].insertId);
    const importResult = await tx.insert(organizationOfficialSourceImports).values({ organizationId: input.organizationId, catalogSourceId: catalog.id, requirementSourceId, scopeConfirmation: input.scopeConfirmation, status: "em_revisao", importedByUserId: input.importedByUserId });
    return { importId: Number(importResult[0].insertId), requirementSourceId, catalog };
  });
}

export async function getOfficialSourceImportForOrganization(importId: number, organizationId: number) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const record = (await db.select().from(organizationOfficialSourceImports).where(and(eq(organizationOfficialSourceImports.id, importId), eq(organizationOfficialSourceImports.organizationId, organizationId))).limit(1))[0];
  if (!record) throw new Error("A importação de fonte não pertence à organização atual.");
  assertOfficialSourceImportScope(record, organizationId);
  return record;
}

export function assertOfficialSourceImportScope(record: { organizationId: number }, organizationId: number) {
  if (record.organizationId !== organizationId) throw new Error("A importação de fonte não pertence à organização atual.");
}

export function validateRequirementSourceProvenance(source: { officialOriginStatus?: "oficial" | "documento_organizacao" | "pendente" | null; sourceUrl?: string | null; jurisdiction?: string | null }) {
  if (!source.officialOriginStatus || source.officialOriginStatus === "pendente") throw new Error("A origem da fonte precisa ser classificada antes do uso no motor.");
  if (!source.jurisdiction?.trim()) throw new Error("A fonte exige jurisdição antes do uso no motor.");
  if (source.officialOriginStatus === "oficial" && !source.sourceUrl) throw new Error("Fontes oficiais exigem URL de origem oficial.");
}
export async function createRequirement(input: typeof requirements.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(requirements).values(input))[0].insertId); }
export async function createRequirementVersion(input: typeof requirementVersions.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível"); return Number((await db.insert(requirementVersions).values(input))[0].insertId); }

export async function createRequirementSourceConflict(input: typeof requirementSourceConflicts.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  if (input.primarySourceId === input.conflictingSourceId) throw new Error("O conflito exige duas fontes distintas.");
  await Promise.all([getSourceForOrganization(input.primarySourceId, input.organizationId), getSourceForOrganization(input.conflictingSourceId, input.organizationId)]);
  return Number((await db.insert(requirementSourceConflicts).values(input))[0].insertId);
}

export async function resolveRequirementSourceConflict(input: { conflictId: number; organizationId: number; reviewerUserId: number; resolutionRationale: string; status: "resolvido" | "nao_aplicavel" }) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.update(requirementSourceConflicts).set({ status: input.status, resolutionRationale: input.resolutionRationale, reviewedByUserId: input.reviewerUserId, reviewedAt: new Date() }).where(and(eq(requirementSourceConflicts.id, input.conflictId), eq(requirementSourceConflicts.organizationId, input.organizationId), eq(requirementSourceConflicts.status, "pendente_revisao")));
  if (result[0].affectedRows !== 1) throw new Error("O conflito não pertence à organização atual ou já foi revisado.");
}

export async function updateOrganizationOnboarding(input: { organizationId: number; updatedByUserId: number; sourceCatalogReady: boolean; assetContextReady: boolean; evidencePackageReady: boolean; technicalReviewReady: boolean; currentStep: "fontes" | "ativo" | "evidencias" | "revisao" }) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(organizationOnboarding).values(input).onDuplicateKeyUpdate({ set: { sourceCatalogReady: input.sourceCatalogReady, assetContextReady: input.assetContextReady, evidencePackageReady: input.evidencePackageReady, technicalReviewReady: input.technicalReviewReady, currentStep: input.currentStep, updatedByUserId: input.updatedByUserId } });
}

export async function getSourceForOrganization(sourceId: number, organizationId: number) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const source = (await db.select().from(requirementSources).where(and(eq(requirementSources.id, sourceId), eq(requirementSources.organizationId, organizationId))).limit(1))[0];
  if (!source) throw new Error("A fonte não pertence à organização atual.");
  return source;
}

export async function getRequirementForOrganization(requirementId: number, organizationId: number) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const requirement = (await db.select().from(requirements).where(and(eq(requirements.id, requirementId), eq(requirements.organizationId, organizationId))).limit(1))[0];
  if (!requirement) throw new Error("O requisito não pertence à organização atual.");
  return requirement;
}

export async function reviewRequirementApplicability(input: { requirementId: number; organizationId: number; reviewerUserId: number; status: "aplicavel_confirmada" | "nao_aplicavel"; rationale: string }) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.update(requirements).set({ applicabilityStatus: input.status, applicabilityReviewNote: input.rationale, applicabilityReviewedByUserId: input.reviewerUserId, applicabilityReviewedAt: new Date() }).where(and(eq(requirements.id, input.requirementId), eq(requirements.organizationId, input.organizationId)));
  if (result[0].affectedRows !== 1) throw new Error("O requisito não pertence à organização atual.");
}

export async function getRequirementVersionForOrganization(versionId: number, organizationId: number) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const version = (await db.select().from(requirementVersions).where(and(eq(requirementVersions.id, versionId), eq(requirementVersions.organizationId, organizationId))).limit(1))[0];
  if (!version) throw new Error("A versão do requisito não pertence à organização atual.");
  return version;
}

function isEffectiveAt(item: { effectiveFrom: Date | null; effectiveTo: Date | null }, at = new Date()) {
  return (!item.effectiveFrom || item.effectiveFrom.getTime() <= at.getTime()) && (!item.effectiveTo || item.effectiveTo.getTime() >= at.getTime());
}

export async function getRequirementApplicationContext(versionId: number, organizationId: number) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const version = await getRequirementVersionForOrganization(versionId, organizationId);
  const requirement = await getRequirementForOrganization(version.requirementId, organizationId);
  const source = await getSourceForOrganization(requirement.sourceId, organizationId);
  const profile = requirement.sectorProfileId ? (await db.select().from(sectorProfiles).where(and(eq(sectorProfiles.id, requirement.sectorProfileId), eq(sectorProfiles.organizationId, organizationId))).limit(1))[0] : null;
  if (requirement.sectorProfileId && !profile) throw new Error("O perfil setorial não pertence à organização atual.");
  return { version, requirement, source, profile, versionIsEffective: isEffectiveAt(version), sourceIsEffective: isEffectiveAt(source) };
}

export async function hasPendingSourceConflict(sourceId: number, organizationId: number) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const rows = await db.select({ primarySourceId: requirementSourceConflicts.primarySourceId, conflictingSourceId: requirementSourceConflicts.conflictingSourceId }).from(requirementSourceConflicts).where(and(eq(requirementSourceConflicts.organizationId, organizationId), eq(requirementSourceConflicts.status, "pendente_revisao")));
  return rows.some((row) => row.primarySourceId === sourceId || row.conflictingSourceId === sourceId);
}

export function assertObligationContextCanProceed(context: { source: { verificationStatus: string; officialOriginStatus?: "oficial" | "documento_organizacao" | "pendente" | null; sourceUrl?: string | null; jurisdiction?: string | null }; version: { reviewStatus: string }; requirement: { applicabilityStatus: string }; sourceIsEffective: boolean; versionIsEffective: boolean }, conflictPending: boolean) {
  validateRequirementSourceProvenance(context.source);
  if (context.source.verificationStatus !== "verificada") throw new Error("Somente fontes verificadas podem apoiar uma obrigação.");
  if (context.version.reviewStatus !== "verificada") throw new Error("Somente versões verificadas podem gerar uma obrigação.");
  if (!context.sourceIsEffective || !context.versionIsEffective) throw new Error("A fonte ou a versão do requisito está fora da vigência declarada.");
  if (context.requirement.applicabilityStatus !== "aplicavel_confirmada") throw new Error("Aplicabilidade pendente de revisão técnica.");
  if (conflictPending) throw new Error("Existe conflito de fonte pendente de revisão técnica.");
}

export async function verifyRequirementSource(input: { sourceId: number; organizationId: number; reviewerUserId: number }) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const source = await getSourceForOrganization(input.sourceId, input.organizationId);
  if (source.officialOriginStatus === "pendente") throw new Error("A origem da fonte precisa ser classificada antes da verificação.");
  if (source.officialOriginStatus === "oficial" && !source.sourceUrl) throw new Error("Fontes oficiais exigem URL de origem oficial.");
  await db.update(requirementSources).set({ verificationStatus: "verificada", verifiedByUserId: input.reviewerUserId, verifiedAt: new Date() }).where(and(eq(requirementSources.id, input.sourceId), eq(requirementSources.organizationId, input.organizationId)));
}

export async function verifyRequirementVersion(input: { versionId: number; organizationId: number; reviewerUserId: number }) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const version = await getRequirementVersionForOrganization(input.versionId, input.organizationId);
  const requirement = await getRequirementForOrganization(version.requirementId, input.organizationId);
  const source = await getSourceForOrganization(requirement.sourceId, input.organizationId);
  if (source.verificationStatus !== "verificada") throw new Error("A fonte precisa estar verificada antes da versão do requisito.");
  if (requirement.applicabilityStatus !== "aplicavel_confirmada") throw new Error("A aplicabilidade do requisito precisa de revisão técnica antes da versão ser verificada.");
  await db.transaction(async (tx) => {
    await tx.update(requirementVersions).set({ reviewStatus: "verificada", reviewedByUserId: input.reviewerUserId, reviewedAt: new Date() }).where(and(eq(requirementVersions.id, input.versionId), eq(requirementVersions.organizationId, input.organizationId)));
    await tx.update(requirements).set({ status: "ativo" }).where(and(eq(requirements.id, version.requirementId), eq(requirements.organizationId, input.organizationId)));
  });
}

export async function createObligationInstance(input: typeof obligationInstances.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const context = await getRequirementApplicationContext(input.requirementVersionId, input.organizationId);
  assertObligationContextCanProceed(context, await hasPendingSourceConflict(context.source.id, input.organizationId));
  if (!input.scopeJustification.trim()) throw new Error("A obrigação exige justificativa de escopo.");
  return Number((await db.insert(obligationInstances).values(input))[0].insertId);
}

export async function linkEvidenceToObligation(input: typeof obligationEvidenceLinks.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const obligation = (await db.select().from(obligationInstances).where(and(eq(obligationInstances.id, input.obligationId), eq(obligationInstances.organizationId, input.organizationId))).limit(1))[0];
  if (!obligation) throw new Error("A obrigação não pertence à organização atual.");
  await getEvidenceForOrganization(input.evidenceId, input.organizationId);
  const linkId = Number((await db.insert(obligationEvidenceLinks).values(input))[0].insertId);
  await syncObligationEvidenceStatus(input.obligationId, input.organizationId);
  return linkId;
}

export async function assignObligationResponsible(input: { obligationId: number; organizationId: number; responsibleUserId: number | null }) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  if (input.responsibleUserId) {
    const member = await getMemberOfOrganization(input.organizationId, input.responsibleUserId);
    if (!member) throw new Error("O responsável precisa ser membro da organização.");
  }
  const result = await db.update(obligationInstances).set({ responsibleUserId: input.responsibleUserId }).where(and(eq(obligationInstances.id, input.obligationId), eq(obligationInstances.organizationId, input.organizationId)));
  if (result[0].affectedRows !== 1) throw new Error("A obrigação não pertence à organização atual.");
}

export async function decideObligation(input: { obligationId: number; organizationId: number; requirementVersionId: number; decision: "cumprida" | "nao_cumprida" | "nao_aplicavel" | "requer_revisao"; rationale: string; decidedByUserId: number }) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível");
  const obligation = (await db.select().from(obligationInstances).where(and(eq(obligationInstances.id, input.obligationId), eq(obligationInstances.organizationId, input.organizationId))).limit(1))[0];
  if (!obligation) throw new Error("A obrigação não pertence à organização atual.");
  if (obligation.requirementVersionId !== input.requirementVersionId) throw new Error("A decisão deve citar a versão aplicada à obrigação.");
  const context = await getRequirementApplicationContext(input.requirementVersionId, input.organizationId);
  assertObligationContextCanProceed(context, await hasPendingSourceConflict(context.source.id, input.organizationId));
  return db.transaction(async (tx) => {
    const decisionId = Number((await tx.insert(obligationDecisions).values(input))[0].insertId);
    const status = input.decision === "cumprida" ? "cumprida" : input.decision === "nao_aplicavel" ? "nao_aplicavel" : input.decision === "requer_revisao" ? "aguardando_revisao" : "aberta";
    await tx.update(obligationInstances).set({ status }).where(and(eq(obligationInstances.id, input.obligationId), eq(obligationInstances.organizationId, input.organizationId)));
    return decisionId;
  });
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
  const linkedObligations = await db.select({ obligationId: obligationEvidenceLinks.obligationId }).from(obligationEvidenceLinks).where(and(eq(obligationEvidenceLinks.evidenceId, review.evidenceId), eq(obligationEvidenceLinks.organizationId, input.organizationId)));
  await Promise.all(linkedObligations.map((item) => syncObligationEvidenceStatus(item.obligationId, input.organizationId)));
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
