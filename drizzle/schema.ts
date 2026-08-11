import {
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
