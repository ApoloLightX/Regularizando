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
  observedMimeType: varchar("observedMimeType", { length: 120 }),
  sizeBytes: int("sizeBytes").notNull(),
  sha256: varchar("sha256", { length: 64 }),
  quarantineStatus: mysqlEnum("quarantineStatus", ["uploaded", "quarantined_unscanned", "validated", "approved_for_processing", "blocked"]).default("uploaded").notNull(),
  structuralValidationStatus: mysqlEnum("structuralValidationStatus", ["pendente", "aprovada", "rejeitada"]).default("pendente").notNull(),
  quarantineNote: varchar("quarantineNote", { length: 500 }),
  processingAuthorizedByUserId: int("processingAuthorizedByUserId"),
  processingAuthorizedAt: timestamp("processingAuthorizedAt"),
  downloadAuthorizedByUserId: int("downloadAuthorizedByUserId"),
  downloadAuthorizedAt: timestamp("downloadAuthorizedAt"),
  downloadAuthorizationNote: varchar("downloadAuthorizationNote", { length: 500 }),
  reviewStatus: mysqlEnum("reviewStatus", ["enviada", "verificada", "rejeitada"]).default("enviada").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("evidence_organization_idx").on(table.organizationId),
  index("evidence_entity_idx").on(table.entityType, table.entityId),
  index("evidence_quarantine_idx").on(table.organizationId, table.quarantineStatus),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "evidence_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.uploadedByUserId], foreignColumns: [users.id], name: "evidence_uploader_fk" }),
  foreignKey({ columns: [table.processingAuthorizedByUserId], foreignColumns: [users.id], name: "evidence_processing_authorizer_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.downloadAuthorizedByUserId], foreignColumns: [users.id], name: "evidence_download_authorizer_fk" }).onDelete("set null"),
]);

/** Bucket compartilhado por instâncias; expira sem depender de memória local. */
export const rateLimitBuckets = mysqlTable("rateLimitBuckets", {
  id: int("id").autoincrement().primaryKey(),
  bucketKey: varchar("bucketKey", { length: 128 }).notNull().unique(),
  scope: varchar("scope", { length: 40 }).notNull(),
  windowStart: timestamp("windowStart").notNull(),
  requestCount: int("requestCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("rate_limit_expiry_idx").on(table.expiresAt), index("rate_limit_scope_expiry_idx").on(table.scope, table.expiresAt)]);

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

/** Política configurável por organização; não executa exclusão automática sem aprovação humana. */
export const dataRetentionPolicies = mysqlTable("dataRetentionPolicies", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  dataCategory: mysqlEnum("dataCategory", ["evidencia", "lead", "auditoria", "conta", "operacional"]).notNull(),
  retentionDays: int("retentionDays"),
  legalBasisNote: text("legalBasisNote").notNull(),
  disposalMethod: mysqlEnum("disposalMethod", ["revisao_manual", "anonimizacao_revisada", "exclusao_revisada"]).default("revisao_manual").notNull(),
  status: mysqlEnum("status", ["rascunho", "em_revisao", "ativa", "substituida"]).default("rascunho").notNull(),
  approvedByUserId: int("approvedByUserId"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("retention_policy_org_category_unique").on(table.organizationId, table.dataCategory),
  index("retention_policy_org_status_idx").on(table.organizationId, table.status),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "retention_policy_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.approvedByUserId], foreignColumns: [users.id], name: "retention_policy_approver_fk" }).onDelete("set null"),
]);

/** Snapshot imutável de cada atualização de política; a tabela principal contém apenas o estado corrente. */
export const dataRetentionPolicyVersions = mysqlTable("dataRetentionPolicyVersions", {
  id: int("id").autoincrement().primaryKey(),
  policyId: int("policyId").notNull(),
  organizationId: int("organizationId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  dataCategory: mysqlEnum("dataCategory", ["evidencia", "lead", "auditoria", "conta", "operacional"]).notNull(),
  retentionDays: int("retentionDays"),
  legalBasisNote: text("legalBasisNote").notNull(),
  disposalMethod: mysqlEnum("disposalMethod", ["revisao_manual", "anonimizacao_revisada", "exclusao_revisada"]).notNull(),
  status: mysqlEnum("status", ["rascunho", "em_revisao", "ativa", "substituida"]).notNull(),
  recordedByUserId: int("recordedByUserId").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("retention_policy_version_unique").on(table.policyId, table.versionNumber),
  index("retention_policy_version_org_idx").on(table.organizationId, table.dataCategory, table.recordedAt),
  foreignKey({ columns: [table.policyId], foreignColumns: [dataRetentionPolicies.id], name: "retention_policy_version_policy_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "retention_policy_version_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.recordedByUserId], foreignColumns: [users.id], name: "retention_policy_version_recorder_fk" }).onDelete("restrict"),
]);

/** Pedido de direito do titular; a referência é pseudonimizada e qualquer descarte exige revisão manual. */
export const dataSubjectRequests = mysqlTable("dataSubjectRequests", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  subjectReferenceHash: varchar("subjectReferenceHash", { length: 64 }).notNull(),
  requestType: mysqlEnum("requestType", ["acesso", "exportacao", "correcao", "eliminacao", "anonimizacao", "oposicao"]).notNull(),
  status: mysqlEnum("status", ["recebida", "em_revisao", "aguardando_controlador", "atendida", "recusada", "cancelada", "nova", "em_analise", "aguardando_informacoes", "aprovada", "rejeitada", "executada", "encerrada"]).default("nova").notNull(),
  scopeNote: text("scopeNote").notNull(),
  assignedToUserId: int("assignedToUserId"),
  assignedAt: timestamp("assignedAt"),
  decisionRationale: text("decisionRationale"),
  handledByUserId: int("handledByUserId"),
  handledAt: timestamp("handledAt"),
  executionNote: text("executionNote"),
  executedAt: timestamp("executedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("subject_request_org_status_idx").on(table.organizationId, table.status),
  index("subject_request_reference_idx").on(table.subjectReferenceHash, table.createdAt),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "subject_request_organization_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.assignedToUserId], foreignColumns: [users.id], name: "subject_request_assignee_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.handledByUserId], foreignColumns: [users.id], name: "subject_request_handler_fk" }).onDelete("set null"),
]);

/** Evidências e marcos de atendimento; armazena referências e justificativas, não bytes de documentos. */
export const dataSubjectRequestEvents = mysqlTable("dataSubjectRequestEvents", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  organizationId: int("organizationId").notNull(),
  eventType: mysqlEnum("eventType", ["evidencia", "nota", "decisao", "atribuicao", "execucao", "encerramento"]).notNull(),
  evidenceReference: varchar("evidenceReference", { length: 500 }),
  note: text("note").notNull(),
  recordedByUserId: int("recordedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("subject_request_event_request_idx").on(table.requestId, table.createdAt),
  index("subject_request_event_org_idx").on(table.organizationId, table.createdAt),
  foreignKey({ columns: [table.requestId], foreignColumns: [dataSubjectRequests.id], name: "subject_request_event_request_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "subject_request_event_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.recordedByUserId], foreignColumns: [users.id], name: "subject_request_event_recorder_fk" }).onDelete("restrict"),
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

/** Catálogo curado de fontes oficiais reutilizáveis; não contém obrigações, prazos ou interpretações aplicáveis a clientes. */
export const officialSourceCatalog = mysqlTable("officialSourceCatalog", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull(),
  title: varchar("title", { length: 260 }).notNull(),
  issuer: varchar("issuer", { length: 180 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["norma", "orientacao_tecnica"]).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 140 }).notNull(),
  authorityLevel: mysqlEnum("authorityLevel", ["federal", "estadual", "municipal", "setorial", "outro"]).notNull(),
  identifier: varchar("identifier", { length: 180 }).notNull(),
  sourceVersionLabel: varchar("sourceVersionLabel", { length: 80 }),
  sourceUrl: varchar("sourceUrl", { length: 700 }).notNull(),
  publicationDate: timestamp("publicationDate"),
  catalogScope: text("catalogScope").notNull(),
  importLimitNote: text("importLimitNote").notNull(),
  effectiveFrom: timestamp("effectiveFrom"),
  effectiveTo: timestamp("effectiveTo"),
  validationStatus: mysqlEnum("validationStatus", ["verificada", "arquivada"]).default("verificada").notNull(),
  lastValidatedAt: timestamp("lastValidatedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("official_catalog_slug_unique").on(table.slug),
  uniqueIndex("official_catalog_identifier_unique").on(table.identifier),
  index("official_catalog_status_idx").on(table.validationStatus, table.authorityLevel),
]);

/** Importação explícita de uma fonte oficial para a fronteira organizacional; a aplicabilidade segue pendente até revisão humana. */
export const organizationOfficialSourceImports = mysqlTable("organizationOfficialSourceImports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  catalogSourceId: int("catalogSourceId").notNull(),
  requirementSourceId: int("requirementSourceId").notNull(),
  scopeConfirmation: text("scopeConfirmation").notNull(),
  status: mysqlEnum("status", ["importada", "em_revisao", "confirmada", "arquivada"]).default("importada").notNull(),
  importedByUserId: int("importedByUserId").notNull(),
  confirmedByUserId: int("confirmedByUserId"),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("organization_catalog_import_unique").on(table.organizationId, table.catalogSourceId),
  uniqueIndex("organization_import_source_unique").on(table.requirementSourceId),
  index("organization_catalog_import_status_idx").on(table.organizationId, table.status),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "organization_catalog_import_organization_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.catalogSourceId], foreignColumns: [officialSourceCatalog.id], name: "organization_catalog_import_catalog_fk" }).onDelete("restrict"),
  foreignKey({ columns: [table.requirementSourceId], foreignColumns: [requirementSources.id], name: "organization_catalog_import_source_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.importedByUserId], foreignColumns: [users.id], name: "organization_catalog_import_user_fk" }),
  foreignKey({ columns: [table.confirmedByUserId], foreignColumns: [users.id], name: "organization_catalog_import_confirmer_fk" }).onDelete("set null"),
]);

/** Casos públicos oficiais para QA e demonstração técnica; nunca pertencem a organizações ou clientes. */
export const publicValidationCases = mysqlTable("publicValidationCases", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull(),
  title: varchar("title", { length: 260 }).notNull(),
  purpose: text("purpose").notNull(),
  classification: mysqlEnum("classification", ["caso_publico_validacao_tecnica"]).default("caso_publico_validacao_tecnica").notNull(),
  status: mysqlEnum("status", ["ativo", "arquivado"]).default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("public_validation_case_slug_unique").on(table.slug),
  index("public_validation_case_status_idx").on(table.status),
]);

/** Documento oficial pertencente exclusivamente a um caso público de validação técnica. */
export const publicValidationSources = mysqlTable("publicValidationSources", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  title: varchar("title", { length: 260 }).notNull(),
  issuer: varchar("issuer", { length: 180 }).notNull(),
  documentType: mysqlEnum("documentType", ["licenca_operacao", "orientacao_tecnica"]).notNull(),
  identifier: varchar("identifier", { length: 180 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 140 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 700 }).notNull(),
  sourceHash: varchar("sourceHash", { length: 128 }),
  publicationDate: timestamp("publicationDate"),
  effectiveFrom: timestamp("effectiveFrom"),
  effectiveTo: timestamp("effectiveTo"),
  extractionMethod: mysqlEnum("extractionMethod", ["texto_nativo", "ocr", "referencia_manual"]).notNull(),
  sourceQualityStatus: mysqlEnum("sourceQualityStatus", ["verificada", "ocr_exige_conferencia_visual"]).default("verificada").notNull(),
  importedAt: timestamp("importedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("public_validation_source_slug_unique").on(table.slug),
  uniqueIndex("public_validation_case_source_identifier_unique").on(table.caseId, table.identifier),
  index("public_validation_source_case_idx").on(table.caseId, table.documentType),
  foreignKey({ columns: [table.caseId], foreignColumns: [publicValidationCases.id], name: "public_validation_source_case_fk" }).onDelete("cascade"),
]);

/** Achados extraídos de fonte pública: não são obrigações de clientes e sempre aguardam revisão humana. */
export const publicValidationFindings = mysqlTable("publicValidationFindings", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  conditionCode: varchar("conditionCode", { length: 96 }).notNull(),
  sourceLocator: varchar("sourceLocator", { length: 220 }).notNull(),
  sourceExcerpt: text("sourceExcerpt").notNull(),
  structuredObligation: text("structuredObligation").notNull(),
  dueText: varchar("dueText", { length: 240 }),
  recurrenceLabel: varchar("recurrenceLabel", { length: 120 }),
  expectedEvidenceDescription: text("expectedEvidenceDescription"),
  evidenceBasis: mysqlEnum("evidenceBasis", ["expressa_na_fonte", "nao_identificada_na_fonte"]).default("nao_identificada_na_fonte").notNull(),
  applicabilityStatus: mysqlEnum("applicabilityStatus", ["pendente_revisao_tecnica"]).default("pendente_revisao_tecnica").notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["pendente_revisao_humana", "aprovada", "corrigida", "rejeitada", "solicitada_revisao"]).default("pendente_revisao_humana").notNull(),
  extractionConfidence: mysqlEnum("extractionConfidence", ["texto_verificado", "ocr_exige_conferencia_visual"]).notNull(),
  reviewRationale: text("reviewRationale"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("public_validation_finding_source_condition_unique").on(table.sourceId, table.conditionCode),
  index("public_validation_finding_source_review_idx").on(table.sourceId, table.reviewStatus),
  foreignKey({ columns: [table.sourceId], foreignColumns: [publicValidationSources.id], name: "public_validation_finding_source_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.reviewedByUserId], foreignColumns: [users.id], name: "public_validation_finding_reviewer_fk" }).onDelete("set null"),
]);

/** Requisito técnico derivado de achado público; não é obrigação e não pode ser associado a uma organização. */
export const publicValidationRequirements = mysqlTable("publicValidationRequirements", {
  id: int("id").autoincrement().primaryKey(),
  findingId: int("findingId").notNull(),
  code: varchar("code", { length: 140 }).notNull(),
  title: varchar("title", { length: 260 }).notNull(),
  applicabilityScope: text("applicabilityScope").notNull(),
  applicabilityCriteria: text("applicabilityCriteria").notNull(),
  expectedEvidenceDescription: text("expectedEvidenceDescription"),
  applicabilityStatus: mysqlEnum("applicabilityStatus", ["pendente_revisao_tecnica"]).default("pendente_revisao_tecnica").notNull(),
  status: mysqlEnum("status", ["rascunho", "em_revisao", "verificado", "arquivado"]).default("em_revisao").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("public_validation_requirement_finding_unique").on(table.findingId),
  uniqueIndex("public_validation_requirement_code_unique").on(table.code),
  index("public_validation_requirement_status_idx").on(table.status, table.applicabilityStatus),
  foreignKey({ columns: [table.findingId], foreignColumns: [publicValidationFindings.id], name: "public_validation_requirement_finding_fk" }).onDelete("cascade"),
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

/** Evento de governança com conteúdo imutável e estado de entrega separado para réplica externa segura. */
export const governanceSyncEvents = mysqlTable("governanceSyncEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 64 }).notNull().unique(),
  sourceEventKey: varchar("sourceEventKey", { length: 128 }).notNull().unique(),
  category: mysqlEnum("category", ["site", "authentication", "cybersecurity", "lead", "data_governance", "release", "integration", "operational"]).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 96 }).notNull(),
  entityId: varchar("entityId", { length: 96 }),
  organizationId: int("organizationId"),
  actorUserId: int("actorUserId"),
  metadata: text("metadata"),
  occurredAt: timestamp("occurredAt").notNull(),
  syncStatus: mysqlEnum("syncStatus", ["pending", "synced", "failed"]).default("pending").notNull(),
  syncAttempts: int("syncAttempts").default(0).notNull(),
  nextAttemptAt: timestamp("nextAttemptAt"),
  lastErrorCode: varchar("lastErrorCode", { length: 120 }),
  syncedAt: timestamp("syncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("governance_sync_pending_idx").on(table.syncStatus, table.nextAttemptAt),
  index("governance_sync_occurred_idx").on(table.occurredAt),
  index("governance_sync_category_idx").on(table.category, table.action),
  foreignKey({ columns: [table.organizationId], foreignColumns: [organizations.id], name: "governance_sync_organization_fk" }).onDelete("set null"),
  foreignKey({ columns: [table.actorUserId], foreignColumns: [users.id], name: "governance_sync_actor_fk" }).onDelete("set null"),
]);

/** Consolidação de mudanças por checkpoint, publicação ou revisão de governança. */
export const governanceMilestones = mysqlTable("governanceMilestones", {
  id: int("id").autoincrement().primaryKey(),
  milestoneId: varchar("milestoneId", { length: 64 }).notNull().unique(),
  milestoneKey: varchar("milestoneKey", { length: 128 }).notNull().unique(),
  milestoneType: mysqlEnum("milestoneType", ["checkpoint", "publication", "security_review", "schema_change", "operational_review"]).notNull(),
  sourceReference: varchar("sourceReference", { length: 180 }).notNull(),
  summary: text("summary").notNull(),
  scope: text("scope"),
  occurredAt: timestamp("occurredAt").notNull(),
  syncStatus: mysqlEnum("syncStatus", ["pending", "synced", "failed"]).default("pending").notNull(),
  syncAttempts: int("syncAttempts").default(0).notNull(),
  nextAttemptAt: timestamp("nextAttemptAt"),
  lastErrorCode: varchar("lastErrorCode", { length: 120 }),
  syncedAt: timestamp("syncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("governance_milestone_pending_idx").on(table.syncStatus, table.nextAttemptAt),
  index("governance_milestone_occurred_idx").on(table.occurredAt),
]);

/** Controle durável do job de recuperação de réplicas externas. */
export const governanceSyncControls = mysqlTable("governanceSyncControls", {
  id: int("id").autoincrement().primaryKey(),
  controlKey: varchar("controlKey", { length: 96 }).notNull().unique(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Solicitações comerciais públicas: não contém documentos nem dados operacionais do cliente. */
export const pilotRequests = mysqlTable("pilotRequests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 180 }),
  role: varchar("role", { length: 120 }),
  sector: mysqlEnum("sector", ["telecom", "infraestrutura", "industria", "consultoria", "outro"]).notNull(),
  requestCategory: mysqlEnum("requestCategory", ["pilot", "privacy"]).default("pilot").notNull(),
  privacyRequestType: mysqlEnum("privacyRequestType", ["acesso", "confirmacao_tratamento", "correcao", "exportacao", "eliminacao", "anonimizacao", "oposicao", "duvida"]),
  privacyNoticeVersion: varchar("privacyNoticeVersion", { length: 32 }),
  leadOrigin: mysqlEnum("leadOrigin", ["website", "referral", "event", "partner", "outbound", "other"]).default("website").notNull(),
  qualificationStage: mysqlEnum("qualificationStage", ["captured", "mql", "sql", "disqualified", "converted"]).default("captured").notNull(),
  qualifiedByUserId: int("qualifiedByUserId"),
  qualifiedAt: timestamp("qualifiedAt"),
  qualificationNote: varchar("qualificationNote", { length: 500 }),
  portfolioSize: varchar("portfolioSize", { length: 80 }),
  challenge: text("challenge"),
  consentedAt: timestamp("consentedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("pilot_request_created_idx").on(table.createdAt),
  index("pilot_request_email_idx").on(table.email),
  index("pilot_request_stage_idx").on(table.qualificationStage, table.createdAt),
  foreignKey({ columns: [table.qualifiedByUserId], foreignColumns: [users.id], name: "pilot_request_qualifier_fk" }).onDelete("set null"),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
