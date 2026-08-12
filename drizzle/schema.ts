import {
  boolean,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Identidade sincronizada pelo Manus OAuth. A organização nunca é inferida pelo
 * usuário: todas as entidades de domínio usam organizationId e são validadas no servidor.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  sector: mysqlEnum("sector", ["telecom", "infraestrutura", "industria", "consultoria", "outro"]).default("telecom").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const organizationMembers = mysqlTable("organizationMembers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "analyst", "reviewer", "viewer"]).default("analyst").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("organization_member_unique").on(table.organizationId, table.userId),
  index("organization_member_user_idx").on(table.userId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "member_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "member_user_fk" }).onDelete("cascade"),
]);

/** Convites são destinados a um e-mail específico; somente o hash do token é persistido. */
export const organizationInvites = mysqlTable("organizationInvites", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["admin", "analyst", "reviewer", "viewer"]).default("analyst").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pendente", "aceito", "revogado", "expirado"]).default("pendente").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  acceptedByUserId: int("acceptedByUserId"),
  acceptedAt: timestamp("acceptedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("invite_organization_status_idx").on(table.organizationId, table.status),
  index("invite_email_status_idx").on(table.email, table.status),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "invite_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.createdByUserId], foreignColumns: [users.id], name: "invite_creator_fk" }),
  foreignKey({ columns: [table.acceptedByUserId], foreignColumns: [users.id], name: "invite_acceptor_fk" }).onDelete("set null"),
]);

/** Unidades distribuídas: sites de telecom, obras, estações ou empreendimentos. */
export const sites = mysqlTable("sites", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  code: varchar("code", { length: 80 }).notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  operationalStatus: mysqlEnum("operationalStatus", ["operacao", "implantacao", "manutencao", "desmobilizado"]).default("operacao").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["baixo", "moderado", "alto", "critico"]).default("moderado").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("site_org_code_unique").on(table.organizationId, table.code),
  index("site_organization_idx").on(table.organizationId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "site_organization_fk" }).onDelete("cascade"),
]);

export const licenses = mysqlTable("licenses", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  siteId: int("siteId"),
  title: varchar("title", { length: 220 }).notNull(),
  licenseType: mysqlEnum("licenseType", ["LP", "LI", "LO", "outorga", "autorizacao", "outro"]).default("LO").notNull(),
  authority: varchar("authority", { length: 160 }),
  licenseNumber: varchar("licenseNumber", { length: 120 }),
  status: mysqlEnum("status", ["vigente", "em_renovacao", "pendente", "vencida", "suspensa"]).default("pendente").notNull(),
  expiryDate: timestamp("expiryDate"),
  riskLevel: mysqlEnum("riskLevel", ["baixo", "moderado", "alto", "critico"]).default("moderado").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("license_organization_idx").on(table.organizationId),
  index("license_site_idx").on(table.siteId),
  index("license_expiry_idx").on(table.expiryDate),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "license_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.siteId], foreignColumns: [sites.id], name: "license_site_fk" }).onDelete("set null"),
]);

export const conditions = mysqlTable("conditions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  licenseId: int("licenseId").notNull(),
  siteId: int("siteId"),
  code: varchar("code", { length: 80 }),
  title: varchar("title", { length: 260 }).notNull(),
  status: mysqlEnum("status", ["em_dia", "em_analise", "atrasada", "bloqueada"]).default("em_analise").notNull(),
  evidenceStatus: mysqlEnum("evidenceStatus", ["ausente", "enviada", "verificada", "rejeitada"]).default("ausente").notNull(),
  ownerName: varchar("ownerName", { length: 160 }),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("condition_organization_idx").on(table.organizationId),
  index("condition_license_idx").on(table.licenseId),
  index("condition_due_idx").on(table.dueDate),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "condition_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.licenseId], foreignColumns: [licenses.id], name: "condition_license_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.siteId], foreignColumns: [sites.id], name: "condition_site_fk" }).onDelete("set null"),
]);

export const capaActions = mysqlTable("capaActions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  siteId: int("siteId"),
  title: varchar("title", { length: 260 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["incidente", "inspecao", "auditoria", "condicionante", "outro"]).default("inspecao").notNull(),
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "critica"]).default("media").notNull(),
  status: mysqlEnum("status", ["aberta", "em_andamento", "aguardando_validacao", "concluida"]).default("aberta").notNull(),
  ownerName: varchar("ownerName", { length: 160 }),
  responsibleUserId: int("responsibleUserId"),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("capa_organization_idx").on(table.organizationId),
  index("capa_status_idx").on(table.status),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "capa_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.siteId], foreignColumns: [sites.id], name: "capa_site_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.responsibleUserId], foreignColumns: [users.id], name: "capa_responsible_user_fk" }).onDelete("set null"),
]);

export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  siteId: int("siteId"),
  title: varchar("title", { length: 260 }).notNull(),
  incidentType: mysqlEnum("incidentType", ["incidente", "quase_acidente", "condicao_insegura", "ambiental"]).default("quase_acidente").notNull(),
  severity: mysqlEnum("severity", ["baixa", "moderada", "alta", "critica"]).default("baixa").notNull(),
  status: mysqlEnum("status", ["aberto", "em_investigacao", "encerrado"]).default("aberto").notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("incident_organization_idx").on(table.organizationId),
  index("incident_occurred_idx").on(table.occurredAt),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "incident_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.siteId], foreignColumns: [sites.id], name: "incident_site_fk" }).onDelete("set null"),
]);

export const esgMetrics = mysqlTable("esgMetrics", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  code: varchar("code", { length: 80 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  category: mysqlEnum("category", ["ambiental", "social", "governanca"]).default("ambiental").notNull(),
  value: decimal("value", { precision: 14, scale: 3 }).notNull(),
  target: decimal("target", { precision: 14, scale: 3 }),
  unit: varchar("unit", { length: 40 }).notNull(),
  periodLabel: varchar("periodLabel", { length: 40 }).notNull(),
  sourceDescription: varchar("sourceDescription", { length: 240 }),
  status: mysqlEnum("status", ["rascunho", "em_revisao", "verificado"]).default("rascunho").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("esg_metric_org_code_period_unique").on(table.organizationId, table.code, table.periodLabel),
  index("esg_metric_org_category_idx").on(table.organizationId, table.category),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "esg_organization_fk" }).onDelete("cascade"),
]);

/** Metadados dos documentos ficam no banco; os bytes são mantidos exclusivamente no S3. */
export const evidences = mysqlTable("evidences", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  uploadedByUserId: int("uploadedByUserId").notNull(),
  entityType: mysqlEnum("entityType", ["licenca", "condicionante", "capa", "incidente", "esg", "site", "outro"]).default("outro").notNull(),
  entityId: int("entityId"),
  fileKey: varchar("fileKey", { length: 512 }).notNull().unique(),
  fileUrl: varchar("fileUrl", { length: 700 }).notNull(),
  fileName: varchar("fileName", { length: 260 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["enviada", "verificada", "rejeitada"]).default("enviada").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("evidence_organization_idx").on(table.organizationId),
  index("evidence_entity_idx").on(table.entityType, table.entityId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "evidence_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.uploadedByUserId], foreignColumns: [users.id], name: "evidence_uploader_fk" }),
]);

/** Revisão humana de evidências: toda decisão traz responsável, estado e data. */
export const reviewRequests = mysqlTable("reviewRequests", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  evidenceId: int("evidenceId").notNull(),
  requestedByUserId: int("requestedByUserId").notNull(),
  reviewerUserId: int("reviewerUserId"),
  status: mysqlEnum("status", ["pendente", "aprovada", "rejeitada"]).default("pendente").notNull(),
  note: varchar("note", { length: 500 }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("review_organization_idx").on(table.organizationId, table.status),
  index("review_evidence_idx").on(table.evidenceId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "review_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.evidenceId], foreignColumns: [evidences.id], name: "review_evidence_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.requestedByUserId], foreignColumns: [users.id], name: "review_requester_fk" }),
  foreignKey({ columns: [table.reviewerUserId], foreignColumns: [users.id], name: "reviewer_user_fk" }).onDelete("set null"),
]);

/** Perfil contextual da organização; orienta o vocabulário sem substituir a fonte documental. */
export const sectorProfiles = mysqlTable("sectorProfiles", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  sector: mysqlEnum("sector", ["telecom", "infraestrutura", "industria", "consultoria", "outro"]).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  versionLabel: varchar("versionLabel", { length: 48 }).notNull(),
  scopeDescription: text("scopeDescription").notNull(),
  status: mysqlEnum("status", ["rascunho", "ativo", "arquivado"]).default("rascunho").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("sector_profile_org_version_unique").on(table.organizationId, table.sector, table.versionLabel),
  index("sector_profile_org_status_idx").on(table.organizationId, table.status),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "sector_profile_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.createdByUserId], foreignColumns: [users.id], name: "sector_profile_creator_fk" }),
]);

/** Fonte primária a partir da qual requisitos podem ser definidos e revisados. */
export const requirementSources = mysqlTable("requirementSources", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  title: varchar("title", { length: 260 }).notNull(),
  issuer: varchar("issuer", { length: 180 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["norma", "licenca", "condicionante", "termo_referencia", "oficio", "orientacao_tecnica", "outro"]).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 140 }),
  authorityLevel: mysqlEnum("authorityLevel", ["federal", "estadual", "municipal", "setorial", "organizacional", "outro"]).default("outro").notNull(),
  officialOriginStatus: mysqlEnum("officialOriginStatus", ["oficial", "documento_organizacao", "pendente"]).default("pendente").notNull(),
  identifier: varchar("identifier", { length: 180 }).notNull(),
  sourceVersionLabel: varchar("sourceVersionLabel", { length: 80 }),
  sourceUrl: varchar("sourceUrl", { length: 700 }),
  publicationDate: timestamp("publicationDate"),
  effectiveFrom: timestamp("effectiveFrom"),
  effectiveTo: timestamp("effectiveTo"),
  verificationStatus: mysqlEnum("verificationStatus", ["rascunho", "em_revisao", "verificada", "arquivada"]).default("rascunho").notNull(),
  verifiedByUserId: int("verifiedByUserId"),
  verifiedAt: timestamp("verifiedAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("requirement_source_org_identifier_unique").on(table.organizationId, table.identifier),
  index("requirement_source_org_status_idx").on(table.organizationId, table.verificationStatus),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "requirement_source_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.createdByUserId], foreignColumns: [users.id], name: "requirement_source_creator_fk" }),
  foreignKey({ columns: [table.verifiedByUserId], foreignColumns: [users.id], name: "requirement_source_verifier_fk" }).onDelete("set null"),
]);

/** Identidade estável de um requisito, sempre apoiada em uma fonte primária. */
export const requirements = mysqlTable("requirements", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  sourceId: int("sourceId").notNull(),
  sectorProfileId: int("sectorProfileId"),
  code: varchar("code", { length: 100 }).notNull(),
  title: varchar("title", { length: 260 }).notNull(),
  applicabilityScope: text("applicabilityScope").notNull(),
  applicabilityCriteria: text("applicabilityCriteria").notNull(),
  applicabilityStatus: mysqlEnum("applicabilityStatus", ["pendente_revisao_tecnica", "aplicavel_confirmada", "nao_aplicavel"]).default("pendente_revisao_tecnica").notNull(),
  applicabilityReviewNote: text("applicabilityReviewNote"),
  applicabilityReviewedByUserId: int("applicabilityReviewedByUserId"),
  applicabilityReviewedAt: timestamp("applicabilityReviewedAt"),
  recurrenceLabel: varchar("recurrenceLabel", { length: 120 }),
  expectedEvidenceDescription: text("expectedEvidenceDescription"),
  status: mysqlEnum("status", ["rascunho", "em_revisao", "ativo", "arquivado"]).default("rascunho").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("requirement_org_code_unique").on(table.organizationId, table.code),
  index("requirement_org_status_idx").on(table.organizationId, table.status),
  index("requirement_source_idx").on(table.sourceId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "requirement_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.sourceId], foreignColumns: [requirementSources.id], name: "requirement_source_fk" }).onDelete("restrict"),
  foreignKey({ columns: [table.sectorProfileId], foreignColumns: [sectorProfiles.id], name: "requirement_profile_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.createdByUserId], foreignColumns: [users.id], name: "requirement_creator_fk" }),
  foreignKey({ columns: [table.applicabilityReviewedByUserId], foreignColumns: [users.id], name: "requirement_applicability_reviewer_fk" }).onDelete("set null"),
]);

/** Conteúdo versionado e revisável; apenas versões verificadas podem apoiar decisões de conformidade. */
export const requirementVersions = mysqlTable("requirementVersions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  requirementId: int("requirementId").notNull(),
  versionLabel: varchar("versionLabel", { length: 48 }).notNull(),
  sourceLocator: varchar("sourceLocator", { length: 220 }).notNull(),
  sourceExcerpt: text("sourceExcerpt").notNull(),
  applicabilityCriteria: text("applicabilityCriteria").notNull(),
  recurrenceLabel: varchar("recurrenceLabel", { length: 120 }),
  expectedEvidenceDescription: text("expectedEvidenceDescription"),
  interpretationNotes: text("interpretationNotes"),
  effectiveFrom: timestamp("effectiveFrom"),
  effectiveTo: timestamp("effectiveTo"),
  reviewStatus: mysqlEnum("reviewStatus", ["rascunho", "em_revisao", "verificada", "obsoleta"]).default("rascunho").notNull(),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("requirement_version_unique").on(table.requirementId, table.versionLabel),
  index("requirement_version_org_status_idx").on(table.organizationId, table.reviewStatus),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "requirement_version_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.requirementId], foreignColumns: [requirements.id], name: "requirement_version_requirement_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.createdByUserId], foreignColumns: [users.id], name: "requirement_version_creator_fk" }),
  foreignKey({ columns: [table.reviewedByUserId], foreignColumns: [users.id], name: "requirement_version_reviewer_fk" }).onDelete("set null"),
]);

/** Divergências entre fontes são registradas e exigem revisão técnica, jamais resolução automática. */
export const requirementSourceConflicts = mysqlTable("requirementSourceConflicts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  primarySourceId: int("primarySourceId").notNull(),
  conflictingSourceId: int("conflictingSourceId").notNull(),
  conflictTopic: varchar("conflictTopic", { length: 260 }).notNull(),
  hierarchyNote: text("hierarchyNote").notNull(),
  status: mysqlEnum("status", ["pendente_revisao", "resolvido", "nao_aplicavel"]).default("pendente_revisao").notNull(),
  resolutionRationale: text("resolutionRationale"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("source_conflict_unique_pair").on(table.organizationId, table.primarySourceId, table.conflictingSourceId),
  index("source_conflict_org_status_idx").on(table.organizationId, table.status),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "source_conflict_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.primarySourceId], foreignColumns: [requirementSources.id], name: "source_conflict_primary_source_fk" }).onDelete("restrict"),
  foreignKey({ columns: [table.conflictingSourceId], foreignColumns: [requirementSources.id], name: "source_conflict_conflicting_source_fk" }).onDelete("restrict"),
  foreignKey({ columns: [table.reviewedByUserId], foreignColumns: [users.id], name: "source_conflict_reviewer_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.createdByUserId], foreignColumns: [users.id], name: "source_conflict_creator_fk" }),
]);

/** Progresso operacional sem documentos simulados, para reduzir o tempo até a primeira revisão técnica. */
export const organizationOnboarding = mysqlTable("organizationOnboarding", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  sourceCatalogReady: boolean("sourceCatalogReady").default(false).notNull(),
  assetContextReady: boolean("assetContextReady").default(false).notNull(),
  evidencePackageReady: boolean("evidencePackageReady").default(false).notNull(),
  technicalReviewReady: boolean("technicalReviewReady").default(false).notNull(),
  currentStep: mysqlEnum("currentStep", ["fontes", "ativo", "evidencias", "revisao"]).default("fontes").notNull(),
  updatedByUserId: int("updatedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("organization_onboarding_unique").on(table.organizationId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "onboarding_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.updatedByUserId], foreignColumns: [users.id], name: "onboarding_user_fk" }),
]);

/** Aplicação concreta de uma versão a uma organização, site ou licença, com responsável e prazo. */
export const obligationInstances = mysqlTable("obligationInstances", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  requirementVersionId: int("requirementVersionId").notNull(),
  siteId: int("siteId"),
  licenseId: int("licenseId"),
  scopeJustification: text("scopeJustification").notNull(),
  dueDate: timestamp("dueDate"),
  responsibleUserId: int("responsibleUserId"),
  status: mysqlEnum("status", ["pendente_validacao", "aberta", "em_andamento", "aguardando_revisao", "cumprida", "nao_aplicavel"]).default("pendente_validacao").notNull(),
  evidenceStatus: mysqlEnum("evidenceStatus", ["ausente", "enviada", "verificada", "rejeitada"]).default("ausente").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("obligation_org_status_due_idx").on(table.organizationId, table.status, table.dueDate),
  index("obligation_requirement_version_idx").on(table.requirementVersionId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "obligation_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.requirementVersionId], foreignColumns: [requirementVersions.id], name: "obligation_requirement_version_fk" }).onDelete("restrict"),
  foreignKey({ columns: [table.siteId], foreignColumns: [sites.id], name: "obligation_site_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.licenseId], foreignColumns: [licenses.id], name: "obligation_license_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.responsibleUserId], foreignColumns: [users.id], name: "obligation_responsible_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.createdByUserId], foreignColumns: [users.id], name: "obligation_creator_fk" }),
]);

/** Vínculo auditável entre evidência existente e obrigação aplicada. */
export const obligationEvidenceLinks = mysqlTable("obligationEvidenceLinks", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  obligationId: int("obligationId").notNull(),
  evidenceId: int("evidenceId").notNull(),
  evidenceRole: mysqlEnum("evidenceRole", ["comprovacao", "fonte", "complemento"]).default("comprovacao").notNull(),
  linkedByUserId: int("linkedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("obligation_evidence_unique").on(table.obligationId, table.evidenceId),
  index("obligation_evidence_org_idx").on(table.organizationId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "obligation_evidence_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.obligationId], foreignColumns: [obligationInstances.id], name: "obligation_evidence_obligation_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.evidenceId], foreignColumns: [evidences.id], name: "obligation_evidence_evidence_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.linkedByUserId], foreignColumns: [users.id], name: "obligation_evidence_linker_fk" }),
]);

/** Decisão humana imutável sobre o estado de uma obrigação e a versão que a fundamenta. */
export const obligationDecisions = mysqlTable("obligationDecisions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  obligationId: int("obligationId").notNull(),
  requirementVersionId: int("requirementVersionId").notNull(),
  decision: mysqlEnum("decision", ["cumprida", "nao_cumprida", "nao_aplicavel", "requer_revisao"]).notNull(),
  rationale: text("rationale").notNull(),
  decidedByUserId: int("decidedByUserId").notNull(),
  decidedAt: timestamp("decidedAt").defaultNow().notNull(),
}, (table) => [
  index("obligation_decision_org_idx").on(table.organizationId, table.decidedAt),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "obligation_decision_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.obligationId], foreignColumns: [obligationInstances.id], name: "obligation_decision_obligation_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.requirementVersionId], foreignColumns: [requirementVersions.id], name: "obligation_decision_version_fk" }).onDelete("restrict"),
  foreignKey({ columns: [table.decidedByUserId], foreignColumns: [users.id], name: "obligation_decision_user_fk" }),
]);

/** Eventos operacionais sensíveis, mantidos como trilha append-only por organização. */
export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  actorUserId: int("actorUserId"),
  action: varchar("action", { length: 96 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  resourceId: int("resourceId"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("audit_organization_created_idx").on(table.organizationId, table.createdAt),
  index("audit_resource_idx").on(table.resourceType, table.resourceId),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "audit_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.actorUserId], foreignColumns: [users.id], name: "audit_actor_user_fk" }).onDelete("set null"),
]);

/** Solicitações comerciais públicas: não contém documentos nem dados operacionais do cliente. */
export const pilotRequests = mysqlTable("pilotRequests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 180 }).notNull(),
  role: varchar("role", { length: 120 }),
  sector: mysqlEnum("sector", ["telecom", "infraestrutura", "industria", "consultoria", "outro"]).notNull(),
  portfolioSize: varchar("portfolioSize", { length: 80 }),
  challenge: text("challenge"),
  consentedAt: timestamp("consentedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("pilot_request_created_idx").on(table.createdAt), index("pilot_request_email_idx").on(table.email)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
