import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  char,
  customType,
  date,
  foreignKey,
  index,
  bigint,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const organizationRole = pgEnum("organization_role", [
  "owner",
  "admin",
  "analyst",
  "reviewer",
  "viewer",
]);

export const projectStatus = pgEnum("project_status", [
  "draft",
  "in_review",
  "ready",
  "archived",
]);

export const licensingProcessStatus = pgEnum("licensing_process_status", [
  "draft",
  "collecting_documents",
  "in_review",
  "ready",
  "archived",
]);

export const spreadsheetImportStatus = pgEnum("spreadsheet_import_status", [
  "recebendo",
  "aguardando_processamento",
  "processando",
  "aguardando_revisao",
  "concluida",
  "concluida_com_alertas",
  "falhou",
  "cancelada",
]);

export const spreadsheetCandidateKind = pgEnum("spreadsheet_candidate_kind", [
  "coordinate",
  "monitoring",
  "document_pending",
]);

export const spreadsheetReviewStatus = pgEnum("spreadsheet_review_status", [
  "proposta",
  "confirmada",
  "editada",
  "rejeitada",
]);

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    fullName: varchar("full_name", { length: 160 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("profiles_full_name_idx").on(table.fullName)],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    ownerId: uuid("owner_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("organizations_slug_unique").on(table.slug),
    index("organizations_owner_id_idx").on(table.ownerId),
    check(
      "organizations_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
  ],
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: organizationRole("role").default("viewer").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId] }),
    index("organization_members_user_id_idx").on(table.userId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    status: projectStatus("status").default("draft").notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("projects_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    index("projects_organization_id_idx").on(table.organizationId),
    index("projects_created_by_idx").on(table.createdBy),
    index("projects_status_idx").on(table.status),
  ],
);

export const organizationInvitations = pgTable(
  "organization_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: organizationRole("role").default("viewer").notNull(),
    tokenHash: bytea("token_hash").notNull().unique(),
    status: text("status").default("pending").notNull(),
    invitedBy: uuid("invited_by").notNull(),
    acceptedBy: uuid("accepted_by"),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .default(sql`now() + interval '7 days'`)
      .notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("organization_invitations_organization_id_idx").on(
      table.organizationId,
    ),
    index("organization_invitations_email_idx").on(table.email),
  ],
);

export const licensingProcesses = pgTable(
  "licensing_processes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    agency: varchar("agency", { length: 160 }),
    municipality: varchar("municipality", { length: 160 }),
    state: char("state", { length: 2 }),
    activity: varchar("activity", { length: 200 }),
    status: licensingProcessStatus("status").default("draft").notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("licensing_processes_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      columns: [table.projectId, table.organizationId],
      foreignColumns: [projects.id, projects.organizationId],
      name: "licensing_processes_project_tenant_fk",
    }).onDelete("cascade"),
    index("licensing_processes_organization_id_idx").on(table.organizationId),
    index("licensing_processes_project_id_idx").on(table.projectId),
    index("licensing_processes_status_idx").on(table.status),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_organization_created_at_idx").on(
      table.organizationId,
      table.createdAt,
    ),
    index("audit_logs_actor_id_idx").on(table.actorId),
  ],
);

export const spreadsheetImports = pgTable(
  "spreadsheet_imports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    licensingProcessId: uuid("licensing_process_id").notNull(),
    storagePath: text("storage_path").notNull().unique(),
    originalName: text("original_name").notNull(),
    declaredMime: text("declared_mime").notNull(),
    detectedMime: text("detected_mime"),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sha256: text("sha256"),
    extractorVersion: text("extractor_version").notNull(),
    status: spreadsheetImportStatus("status").default("recebendo").notNull(),
    totalSheets: integer("total_sheets").default(0).notNull(),
    processedSheets: integer("processed_sheets").default(0).notNull(),
    failedSheets: integer("failed_sheets").default(0).notNull(),
    alertCount: integer("alert_count").default(0).notNull(),
    createdBy: uuid("created_by").notNull(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("spreadsheet_imports_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      columns: [table.licensingProcessId, table.organizationId],
      foreignColumns: [
        licensingProcesses.id,
        licensingProcesses.organizationId,
      ],
      name: "spreadsheet_imports_process_tenant_fk",
    }).onDelete("cascade"),
    uniqueIndex("spreadsheet_imports_idempotency_unique")
      .on(
        table.organizationId,
        table.licensingProcessId,
        table.sha256,
        table.extractorVersion,
      )
      .where(
        sql`${table.sha256} is not null and ${table.status} <> 'cancelada'`,
      ),
    index("spreadsheet_imports_organization_id_idx").on(table.organizationId),
    index("spreadsheet_imports_process_tenant_idx").on(
      table.licensingProcessId,
      table.organizationId,
    ),
    index("spreadsheet_imports_created_by_idx").on(table.createdBy),
    index("spreadsheet_imports_status_idx").on(table.status),
    check(
      "spreadsheet_imports_size_limit",
      sql`${table.sizeBytes} between 1 and 10485760`,
    ),
    check(
      "spreadsheet_imports_sha256_format",
      sql`${table.sha256} is null or ${table.sha256} ~ '^[a-f0-9]{64}$'`,
    ),
  ],
);

export const spreadsheetSheets = pgTable(
  "spreadsheet_sheets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    importId: uuid("import_id").notNull(),
    sheetIndex: integer("sheet_index").notNull(),
    name: text("name").notNull(),
    rowCount: integer("row_count").default(0).notNull(),
    columnCount: integer("column_count").default(0).notNull(),
    classifications: jsonb("classifications")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    confidence: numeric("confidence", { precision: 5, scale: 4 }),
    signals: jsonb("signals")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    alerts: jsonb("alerts")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    status: text("status").default("pendente").notNull(),
    errorCode: text("error_code"),
    sanitizedError: text("sanitized_error"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("spreadsheet_sheets_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    uniqueIndex("spreadsheet_sheets_id_tenant_import_unique").on(
      table.id,
      table.organizationId,
      table.importId,
    ),
    foreignKey({
      columns: [table.importId, table.organizationId],
      foreignColumns: [
        spreadsheetImports.id,
        spreadsheetImports.organizationId,
      ],
      name: "spreadsheet_sheets_import_tenant_fk",
    }).onDelete("cascade"),
    uniqueIndex("spreadsheet_sheets_import_index_unique").on(
      table.importId,
      table.sheetIndex,
    ),
    index("spreadsheet_sheets_organization_id_idx").on(table.organizationId),
    index("spreadsheet_sheets_import_status_index_idx").on(
      table.importId,
      table.status,
      table.sheetIndex,
    ),
  ],
);

export const sourceCells = pgTable(
  "source_cells",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    importId: uuid("import_id").notNull(),
    sheetId: uuid("sheet_id").notNull(),
    rowNumber: integer("row_number").notNull(),
    columnNumber: integer("column_number").notNull(),
    address: text("address").notNull(),
    headerOriginal: text("header_original"),
    rawValue: jsonb("raw_value").notNull(),
    safeText: text("safe_text").notNull(),
    formulaText: text("formula_text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("source_cells_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    uniqueIndex("source_cells_id_tenant_import_unique").on(
      table.id,
      table.organizationId,
      table.importId,
    ),
    foreignKey({
      columns: [table.importId, table.organizationId],
      foreignColumns: [
        spreadsheetImports.id,
        spreadsheetImports.organizationId,
      ],
      name: "source_cells_import_tenant_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sheetId, table.organizationId, table.importId],
      foreignColumns: [
        spreadsheetSheets.id,
        spreadsheetSheets.organizationId,
        spreadsheetSheets.importId,
      ],
      name: "source_cells_sheet_tenant_import_fk",
    }).onDelete("cascade"),
    uniqueIndex("source_cells_sheet_address_unique").on(
      table.sheetId,
      table.address,
    ),
    index("source_cells_organization_id_idx").on(table.organizationId),
    index("source_cells_import_id_idx").on(table.importId),
    index("source_cells_sheet_id_idx").on(table.sheetId),
    check(
      "source_cells_address_format",
      sql`${table.address} ~ '^[A-Z]+[1-9][0-9]*$' and char_length(${table.address}) <= 16`,
    ),
  ],
);

export const spreadsheetCandidates = pgTable(
  "spreadsheet_candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    importId: uuid("import_id").notNull(),
    sheetId: uuid("sheet_id").notNull(),
    kind: spreadsheetCandidateKind("kind").notNull(),
    reviewStatus: spreadsheetReviewStatus("review_status")
      .default("proposta")
      .notNull(),
    confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
    proposedPayload: jsonb("proposed_payload").notNull(),
    confirmedPayload: jsonb("confirmed_payload"),
    alerts: jsonb("alerts")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    ambiguityId: text("ambiguity_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`clock_timestamp()`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("spreadsheet_candidates_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    uniqueIndex("spreadsheet_candidates_id_tenant_import_unique").on(
      table.id,
      table.organizationId,
      table.importId,
    ),
    foreignKey({
      columns: [table.importId, table.organizationId],
      foreignColumns: [
        spreadsheetImports.id,
        spreadsheetImports.organizationId,
      ],
      name: "spreadsheet_candidates_import_tenant_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sheetId, table.organizationId, table.importId],
      foreignColumns: [
        spreadsheetSheets.id,
        spreadsheetSheets.organizationId,
        spreadsheetSheets.importId,
      ],
      name: "spreadsheet_candidates_sheet_tenant_import_fk",
    }).onDelete("cascade"),
    index("spreadsheet_candidates_organization_id_idx").on(
      table.organizationId,
    ),
    index("spreadsheet_candidates_import_status_idx").on(
      table.importId,
      table.reviewStatus,
    ),
    index("spreadsheet_candidates_sheet_id_idx").on(table.sheetId),
    index("spreadsheet_candidates_kind_idx").on(table.kind),
  ],
);

export const coordinateCandidates = pgTable(
  "coordinate_candidates",
  {
    candidateId: uuid("candidate_id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    coordinateSystem: text("coordinate_system"),
    latitudeOriginal: text("latitude_original"),
    longitudeOriginal: text("longitude_original"),
    eastingOriginal: text("easting_original"),
    northingOriginal: text("northing_original"),
    utmZone: smallint("utm_zone"),
    hemisphere: text("hemisphere"),
    datum: text("datum"),
    transformedLatitude: numeric("transformed_latitude"),
    transformedLongitude: numeric("transformed_longitude"),
    transformationMethod: text("transformation_method"),
  },
  (table) => [
    foreignKey({
      columns: [table.candidateId, table.organizationId],
      foreignColumns: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
      ],
      name: "coordinate_candidates_candidate_tenant_fk",
    }).onDelete("cascade"),
    index("coordinate_candidates_organization_id_idx").on(table.organizationId),
  ],
);

export const monitoringCandidates = pgTable(
  "monitoring_candidates",
  {
    candidateId: uuid("candidate_id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    parameterOriginal: text("parameter_original"),
    parameterNormalized: text("parameter_normalized"),
    valueOriginal: text("value_original"),
    valueNormalized: numeric("value_normalized"),
    unitOriginal: text("unit_original"),
    unitNormalized: text("unit_normalized"),
    measuredAt: timestamp("measured_at", { withTimezone: true }),
    samplingPoint: text("sampling_point"),
    method: text("method"),
    laboratory: text("laboratory"),
    readyForComparison: boolean("ready_for_comparison")
      .default(false)
      .notNull(),
    notReadyReason: text("not_ready_reason"),
  },
  (table) => [
    foreignKey({
      columns: [table.candidateId, table.organizationId],
      foreignColumns: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
      ],
      name: "monitoring_candidates_candidate_tenant_fk",
    }).onDelete("cascade"),
    index("monitoring_candidates_organization_id_idx").on(table.organizationId),
  ],
);

export const documentPendingItemCandidates = pgTable(
  "document_pending_item_candidates",
  {
    candidateId: uuid("candidate_id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    documentName: text("document_name"),
    requiredAsStated: boolean("required_as_stated"),
    originalStatus: text("original_status"),
    validUntil: date("valid_until"),
    responsible: text("responsible"),
    proposedDescription: text("proposed_description"),
  },
  (table) => [
    foreignKey({
      columns: [table.candidateId, table.organizationId],
      foreignColumns: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
      ],
      name: "document_pending_candidates_candidate_tenant_fk",
    }).onDelete("cascade"),
    index("document_pending_candidates_organization_id_idx").on(
      table.organizationId,
    ),
  ],
);

export const candidateEvidence = pgTable(
  "candidate_evidence",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    importId: uuid("import_id").notNull(),
    candidateId: uuid("candidate_id").notNull(),
    sourceCellId: uuid("source_cell_id").notNull(),
    ordinal: smallint("ordinal").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.candidateId, table.sourceCellId] }),
    foreignKey({
      columns: [table.candidateId, table.organizationId, table.importId],
      foreignColumns: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
        spreadsheetCandidates.importId,
      ],
      name: "candidate_evidence_candidate_tenant_import_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sourceCellId, table.organizationId, table.importId],
      foreignColumns: [
        sourceCells.id,
        sourceCells.organizationId,
        sourceCells.importId,
      ],
      name: "candidate_evidence_cell_tenant_import_fk",
    }).onDelete("cascade"),
    index("candidate_evidence_organization_id_idx").on(table.organizationId),
    index("candidate_evidence_import_id_idx").on(table.importId),
    index("candidate_evidence_source_cell_id_idx").on(table.sourceCellId),
  ],
);

export const spreadsheetExtractionRuns = pgTable(
  "spreadsheet_extraction_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    importId: uuid("import_id").notNull(),
    sheetId: uuid("sheet_id"),
    extractorVersion: text("extractor_version").notNull(),
    attempt: integer("attempt").default(1).notNull(),
    status: text("status").notNull(),
    ambiguityId: text("ambiguity_id"),
    reservationId: text("reservation_id"),
    aiModel: text("ai_model"),
    aiSchemaVersion: text("ai_schema_version"),
    correlationId: text("correlation_id"),
    aiLatencyMs: integer("ai_latency_ms"),
    aiUsage: jsonb("ai_usage").default({}).notNull(),
    metrics: jsonb("metrics").default({}).notNull(),
    sanitizedError: text("sanitized_error"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.importId, table.organizationId],
      foreignColumns: [
        spreadsheetImports.id,
        spreadsheetImports.organizationId,
      ],
      name: "spreadsheet_extraction_runs_import_tenant_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sheetId, table.organizationId, table.importId],
      foreignColumns: [
        spreadsheetSheets.id,
        spreadsheetSheets.organizationId,
        spreadsheetSheets.importId,
      ],
      name: "spreadsheet_extraction_runs_sheet_tenant_import_fk",
    }).onDelete("cascade"),
    index("spreadsheet_extraction_runs_organization_id_idx").on(
      table.organizationId,
    ),
    index("spreadsheet_extraction_runs_import_id_idx").on(table.importId),
    index("spreadsheet_extraction_runs_sheet_id_idx")
      .on(table.sheetId)
      .where(sql`${table.sheetId} is not null`),
    uniqueIndex("spreadsheet_extraction_runs_sheet_attempt_unique")
      .on(table.sheetId, table.attempt)
      .where(sql`${table.ambiguityId} is null`),
    uniqueIndex("spreadsheet_extraction_runs_ambiguity_unique")
      .on(table.importId, table.ambiguityId)
      .where(sql`${table.ambiguityId} is not null`),
    index("spreadsheet_extraction_runs_ambiguity_id_idx")
      .on(table.ambiguityId)
      .where(sql`${table.ambiguityId} is not null`),
    uniqueIndex("spreadsheet_extraction_runs_reservation_unique")
      .on(table.reservationId)
      .where(sql`${table.reservationId} is not null`),
  ],
);

export const spreadsheetReviewEvents = pgTable(
  "spreadsheet_review_events",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    importId: uuid("import_id").notNull(),
    candidateId: uuid("candidate_id").notNull(),
    actorId: uuid("actor_id").notNull(),
    fromStatus: spreadsheetReviewStatus("from_status").notNull(),
    toStatus: spreadsheetReviewStatus("to_status").notNull(),
    beforePayload: jsonb("before_payload").notNull(),
    afterPayload: jsonb("after_payload"),
    justification: text("justification"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.importId, table.organizationId],
      foreignColumns: [
        spreadsheetImports.id,
        spreadsheetImports.organizationId,
      ],
      name: "spreadsheet_review_events_import_tenant_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.candidateId, table.organizationId, table.importId],
      foreignColumns: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
        spreadsheetCandidates.importId,
      ],
      name: "spreadsheet_review_events_candidate_tenant_import_fk",
    }).onDelete("cascade"),
    index("spreadsheet_review_events_organization_id_idx").on(
      table.organizationId,
    ),
    index("spreadsheet_review_events_import_id_idx").on(table.importId),
    index("spreadsheet_review_events_candidate_created_idx").on(
      table.candidateId,
      table.createdAt,
    ),
    index("spreadsheet_review_events_actor_id_idx").on(table.actorId),
  ],
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  invitations: many(organizationInvitations),
  projects: many(projects),
  licensingProcesses: many(licensingProcesses),
  auditLogs: many(auditLogs),
  spreadsheetImports: many(spreadsheetImports),
  spreadsheetSheets: many(spreadsheetSheets),
  sourceCells: many(sourceCells),
  spreadsheetCandidates: many(spreadsheetCandidates),
  spreadsheetExtractionRuns: many(spreadsheetExtractionRuns),
  spreadsheetReviewEvents: many(spreadsheetReviewEvents),
}));

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    profile: one(profiles, {
      fields: [organizationMembers.userId],
      references: [profiles.id],
    }),
  }),
);

export const projectsRelations = relations(projects, ({ one }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
}));

export const licensingProcessesRelations = relations(
  licensingProcesses,
  ({ many, one }) => ({
    organization: one(organizations, {
      fields: [licensingProcesses.organizationId],
      references: [organizations.id],
    }),
    project: one(projects, {
      fields: [licensingProcesses.projectId],
      references: [projects.id],
    }),
    spreadsheetImports: many(spreadsheetImports),
  }),
);

export const spreadsheetImportsRelations = relations(
  spreadsheetImports,
  ({ many, one }) => ({
    organization: one(organizations, {
      fields: [spreadsheetImports.organizationId],
      references: [organizations.id],
    }),
    licensingProcess: one(licensingProcesses, {
      fields: [
        spreadsheetImports.licensingProcessId,
        spreadsheetImports.organizationId,
      ],
      references: [licensingProcesses.id, licensingProcesses.organizationId],
    }),
    sheets: many(spreadsheetSheets),
    sourceCells: many(sourceCells),
    candidates: many(spreadsheetCandidates),
    extractionRuns: many(spreadsheetExtractionRuns),
    reviewEvents: many(spreadsheetReviewEvents),
  }),
);

export const spreadsheetSheetsRelations = relations(
  spreadsheetSheets,
  ({ many, one }) => ({
    organization: one(organizations, {
      fields: [spreadsheetSheets.organizationId],
      references: [organizations.id],
    }),
    spreadsheetImport: one(spreadsheetImports, {
      fields: [spreadsheetSheets.importId, spreadsheetSheets.organizationId],
      references: [spreadsheetImports.id, spreadsheetImports.organizationId],
    }),
    sourceCells: many(sourceCells),
    candidates: many(spreadsheetCandidates),
    extractionRuns: many(spreadsheetExtractionRuns),
  }),
);

export const sourceCellsRelations = relations(sourceCells, ({ many, one }) => ({
  organization: one(organizations, {
    fields: [sourceCells.organizationId],
    references: [organizations.id],
  }),
  spreadsheetImport: one(spreadsheetImports, {
    fields: [sourceCells.importId, sourceCells.organizationId],
    references: [spreadsheetImports.id, spreadsheetImports.organizationId],
  }),
  sheet: one(spreadsheetSheets, {
    fields: [
      sourceCells.sheetId,
      sourceCells.organizationId,
      sourceCells.importId,
    ],
    references: [
      spreadsheetSheets.id,
      spreadsheetSheets.organizationId,
      spreadsheetSheets.importId,
    ],
  }),
  evidence: many(candidateEvidence),
}));

export const spreadsheetCandidatesRelations = relations(
  spreadsheetCandidates,
  ({ many, one }) => ({
    organization: one(organizations, {
      fields: [spreadsheetCandidates.organizationId],
      references: [organizations.id],
    }),
    spreadsheetImport: one(spreadsheetImports, {
      fields: [
        spreadsheetCandidates.importId,
        spreadsheetCandidates.organizationId,
      ],
      references: [spreadsheetImports.id, spreadsheetImports.organizationId],
    }),
    sheet: one(spreadsheetSheets, {
      fields: [
        spreadsheetCandidates.sheetId,
        spreadsheetCandidates.organizationId,
        spreadsheetCandidates.importId,
      ],
      references: [
        spreadsheetSheets.id,
        spreadsheetSheets.organizationId,
        spreadsheetSheets.importId,
      ],
    }),
    coordinate: one(coordinateCandidates),
    monitoring: one(monitoringCandidates),
    documentPendingItem: one(documentPendingItemCandidates),
    evidence: many(candidateEvidence),
    reviewEvents: many(spreadsheetReviewEvents),
  }),
);

export const coordinateCandidatesRelations = relations(
  coordinateCandidates,
  ({ one }) => ({
    candidate: one(spreadsheetCandidates, {
      fields: [
        coordinateCandidates.candidateId,
        coordinateCandidates.organizationId,
      ],
      references: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
      ],
    }),
  }),
);

export const monitoringCandidatesRelations = relations(
  monitoringCandidates,
  ({ one }) => ({
    candidate: one(spreadsheetCandidates, {
      fields: [
        monitoringCandidates.candidateId,
        monitoringCandidates.organizationId,
      ],
      references: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
      ],
    }),
  }),
);

export const documentPendingItemCandidatesRelations = relations(
  documentPendingItemCandidates,
  ({ one }) => ({
    candidate: one(spreadsheetCandidates, {
      fields: [
        documentPendingItemCandidates.candidateId,
        documentPendingItemCandidates.organizationId,
      ],
      references: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
      ],
    }),
  }),
);

export const candidateEvidenceRelations = relations(
  candidateEvidence,
  ({ one }) => ({
    candidate: one(spreadsheetCandidates, {
      fields: [
        candidateEvidence.candidateId,
        candidateEvidence.organizationId,
        candidateEvidence.importId,
      ],
      references: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
        spreadsheetCandidates.importId,
      ],
    }),
    sourceCell: one(sourceCells, {
      fields: [
        candidateEvidence.sourceCellId,
        candidateEvidence.organizationId,
        candidateEvidence.importId,
      ],
      references: [
        sourceCells.id,
        sourceCells.organizationId,
        sourceCells.importId,
      ],
    }),
  }),
);

export const spreadsheetExtractionRunsRelations = relations(
  spreadsheetExtractionRuns,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [spreadsheetExtractionRuns.organizationId],
      references: [organizations.id],
    }),
    spreadsheetImport: one(spreadsheetImports, {
      fields: [
        spreadsheetExtractionRuns.importId,
        spreadsheetExtractionRuns.organizationId,
      ],
      references: [spreadsheetImports.id, spreadsheetImports.organizationId],
    }),
    sheet: one(spreadsheetSheets, {
      fields: [
        spreadsheetExtractionRuns.sheetId,
        spreadsheetExtractionRuns.organizationId,
        spreadsheetExtractionRuns.importId,
      ],
      references: [
        spreadsheetSheets.id,
        spreadsheetSheets.organizationId,
        spreadsheetSheets.importId,
      ],
    }),
  }),
);

export const spreadsheetReviewEventsRelations = relations(
  spreadsheetReviewEvents,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [spreadsheetReviewEvents.organizationId],
      references: [organizations.id],
    }),
    spreadsheetImport: one(spreadsheetImports, {
      fields: [
        spreadsheetReviewEvents.importId,
        spreadsheetReviewEvents.organizationId,
      ],
      references: [spreadsheetImports.id, spreadsheetImports.organizationId],
    }),
    candidate: one(spreadsheetCandidates, {
      fields: [
        spreadsheetReviewEvents.candidateId,
        spreadsheetReviewEvents.organizationId,
        spreadsheetReviewEvents.importId,
      ],
      references: [
        spreadsheetCandidates.id,
        spreadsheetCandidates.organizationId,
        spreadsheetCandidates.importId,
      ],
    }),
  }),
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type OrganizationInvitation =
  typeof organizationInvitations.$inferSelect;
export type LicensingProcess = typeof licensingProcesses.$inferSelect;
export type NewLicensingProcess = typeof licensingProcesses.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type SpreadsheetImport = typeof spreadsheetImports.$inferSelect;
export type SpreadsheetCandidate = typeof spreadsheetCandidates.$inferSelect;
export type SpreadsheetReviewEvent =
  typeof spreadsheetReviewEvents.$inferSelect;
