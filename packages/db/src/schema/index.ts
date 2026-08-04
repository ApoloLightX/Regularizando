import { relations, sql } from "drizzle-orm";
import {
  check,
  char,
  customType,
  foreignKey,
  index,
  bigint,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
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

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  invitations: many(organizationInvitations),
  projects: many(projects),
  licensingProcesses: many(licensingProcesses),
  auditLogs: many(auditLogs),
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
  ({ one }) => ({
    organization: one(organizations, {
      fields: [licensingProcesses.organizationId],
      references: [organizations.id],
    }),
    project: one(projects, {
      fields: [licensingProcesses.projectId],
      references: [projects.id],
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
