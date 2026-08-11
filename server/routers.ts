import { createHash, randomBytes, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  acceptOrganizationInvite,
  assertEntityBelongsToOrganization,
  assignCapaResponsible,
  assignReviewResponsible,
  createCapaAction,
  createCondition,
  createEsgMetric,
  createEvidence,
  createIncident,
  createLicense,
  createOrganizationForUser,
  createOrganizationInvite,
  createPilotRequest,
  createReviewRequest,
  createSite,
  decideReviewRequest,
  getDashboardData,
  getInviteByHash,
  getMemberOfOrganizationByEmail,
  getOrganizationForUser,
  getTeamOverview,
  revokeOrganizationInvite,
  type OwnedEntityType,
} from "./db";
import { storagePut } from "./storage";
import { canManageTeam, canReviewEvidence, normalizeInvitationEmail, requireWorkspaceContext } from "./regularizando.policy";
import { makeOrganizationSlug, safeEvidenceName, validateEvidenceUpload } from "./regularizando.validation";

const organizationInput = z.object({ name: z.string().trim().min(3).max(160), sector: z.enum(["telecom", "infraestrutura", "industria", "consultoria", "outro"]) });
const entityType = z.enum(["licenca", "condicionante", "capa", "incidente", "esg", "site", "outro"]);
const invitationRole = z.enum(["admin", "analyst", "reviewer", "viewer"]);
const safeOrigin = z.string().url().refine((value) => { const parsed = new URL(value); return ["http:", "https:"].includes(parsed.protocol) && parsed.origin === value; }, "Origem de convite inválida.");
const hashInviteToken = (token: string) => createHash("sha256").update(token).digest("hex");
async function getRequiredOrganization(userId: number) { return requireWorkspaceContext(await getOrganizationForUser(userId)); }
function requireTeamManager(role: string) { if (!canManageTeam(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode gerenciar a equipe." }); }

export const appRouter = router({
  system: systemRouter,
  auth: router({ me: publicProcedure.query(({ ctx }) => ctx.user), logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }) }),
  organization: router({
    current: protectedProcedure.query(({ ctx }) => getOrganizationForUser(ctx.user.id)),
    create: protectedProcedure.input(organizationInput).mutation(async ({ ctx, input }) => { const existing = await getOrganizationForUser(ctx.user.id); if (existing) return existing.organization; return createOrganizationForUser({ ...input, slug: `${makeOrganizationSlug(input.name)}-${randomUUID().slice(0, 6)}`, userId: ctx.user.id }); }),
  }),
  pilot: router({
    request: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().max(320), company: z.string().trim().min(2).max(180), role: z.string().trim().max(120).optional(), sector: z.enum(["telecom", "infraestrutura", "industria", "consultoria", "outro"]), portfolioSize: z.string().trim().max(80).optional(), challenge: z.string().trim().min(10).max(2000).optional(), consent: z.literal(true) })).mutation(async ({ input }) => {
      const id = await createPilotRequest({ name: input.name, email: input.email.toLowerCase(), company: input.company, role: input.role || null, sector: input.sector, portfolioSize: input.portfolioSize || null, challenge: input.challenge || null, consentedAt: new Date() });
      return { id, success: true } as const;
    }),
  }),
  dashboard: router({ overview: protectedProcedure.query(async ({ ctx }) => { const context = await getOrganizationForUser(ctx.user.id); return context ? { organization: context.organization, membership: context.membership, data: await getDashboardData(context.organization.id) } : { organization: null, data: null }; }) }),
  sites: router({ create: protectedProcedure.input(z.object({ name: z.string().min(3).max(180), code: z.string().min(2).max(80), city: z.string().max(100).optional(), state: z.string().length(2).optional(), operationalStatus: z.enum(["operacao", "implantacao", "manutencao", "desmobilizado"]).default("operacao"), riskLevel: z.enum(["baixo", "moderado", "alto", "critico"]).default("moderado") })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); return createSite({ ...input, organizationId: org.organization.id }); }) }),
  licenses: router({ create: protectedProcedure.input(z.object({ title: z.string().min(3).max(220), licenseType: z.enum(["LP", "LI", "LO", "outorga", "autorizacao", "outro"]), authority: z.string().max(160).optional(), licenseNumber: z.string().max(120).optional(), siteId: z.number().int().positive().optional(), status: z.enum(["vigente", "em_renovacao", "pendente", "vencida", "suspensa"]).default("pendente"), riskLevel: z.enum(["baixo", "moderado", "alto", "critico"]).default("moderado"), expiryDate: z.number().int().optional() })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); if (input.siteId) await assertEntityBelongsToOrganization(org.organization.id, "site", input.siteId); return createLicense({ ...input, organizationId: org.organization.id, expiryDate: input.expiryDate ? new Date(input.expiryDate) : null }); }) }),
  conditions: router({ create: protectedProcedure.input(z.object({ licenseId: z.number().int().positive(), siteId: z.number().int().positive().optional(), code: z.string().max(80).optional(), title: z.string().min(3).max(260), ownerName: z.string().max(160).optional(), dueDate: z.number().int().optional() })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); await assertEntityBelongsToOrganization(org.organization.id, "licenca", input.licenseId); if (input.siteId) await assertEntityBelongsToOrganization(org.organization.id, "site", input.siteId); return createCondition({ ...input, organizationId: org.organization.id, dueDate: input.dueDate ? new Date(input.dueDate) : null }); }) }),
  capa: router({
    create: protectedProcedure.input(z.object({ title: z.string().min(3).max(260), siteId: z.number().int().positive().optional(), sourceType: z.enum(["incidente", "inspecao", "auditoria", "condicionante", "outro"]), priority: z.enum(["baixa", "media", "alta", "critica"]), ownerName: z.string().max(160).optional(), dueDate: z.number().int().optional() })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); if (input.siteId) await assertEntityBelongsToOrganization(org.organization.id, "site", input.siteId); return createCapaAction({ ...input, organizationId: org.organization.id, dueDate: input.dueDate ? new Date(input.dueDate) : null }); }),
    assignResponsible: protectedProcedure.input(z.object({ capaId: z.number().int().positive(), responsibleUserId: z.number().int().positive().nullable() })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); requireTeamManager(org.membership.role); await assignCapaResponsible({ ...input, organizationId: org.organization.id }); return { success: true } as const; }),
  }),
  incidents: router({ create: protectedProcedure.input(z.object({ title: z.string().min(3).max(260), siteId: z.number().int().positive().optional(), incidentType: z.enum(["incidente", "quase_acidente", "condicao_insegura", "ambiental"]), severity: z.enum(["baixa", "moderada", "alta", "critica"]), occurredAt: z.number().int() })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); if (input.siteId) await assertEntityBelongsToOrganization(org.organization.id, "site", input.siteId); return createIncident({ ...input, organizationId: org.organization.id, occurredAt: new Date(input.occurredAt) }); }) }),
  esg: router({ createMetric: protectedProcedure.input(z.object({ code: z.string().min(2).max(80), title: z.string().min(3).max(220), category: z.enum(["ambiental", "social", "governanca"]), value: z.number().finite(), target: z.number().finite().optional(), unit: z.string().min(1).max(40), periodLabel: z.string().min(2).max(40), sourceDescription: z.string().max(240).optional(), status: z.enum(["rascunho", "em_revisao", "verificado"]).default("rascunho") })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); return createEsgMetric({ ...input, organizationId: org.organization.id, value: String(input.value), target: input.target === undefined ? null : String(input.target) }); }) }),
  evidences: router({ upload: protectedProcedure.input(z.object({ entityType, entityId: z.number().int().positive().optional(), fileName: z.string().min(1).max(260), mimeType: z.string().min(1).max(120), sizeBytes: z.number().int().positive(), base64: z.string().min(1).max(12_000_000) })).mutation(async ({ ctx, input }) => { validateEvidenceUpload(input); const org = await getRequiredOrganization(ctx.user.id); if (input.entityId && input.entityType === "outro") throw new Error("Registros do tipo 'outro' não podem receber ID de vínculo."); if (input.entityId && input.entityType !== "outro") await assertEntityBelongsToOrganization(org.organization.id, input.entityType as OwnedEntityType, input.entityId); const bytes = Buffer.from(input.base64, "base64"); if (bytes.byteLength !== input.sizeBytes) throw new Error("O tamanho do arquivo não confere com o upload."); const fileName = safeEvidenceName(input.fileName); const stored = await storagePut(`organizations/${org.organization.id}/${input.entityType}/${randomUUID()}-${fileName}`, bytes, input.mimeType); const evidenceId = await createEvidence({ organizationId: org.organization.id, uploadedByUserId: ctx.user.id, entityType: input.entityType, entityId: input.entityId ?? null, fileKey: stored.key, fileUrl: stored.url, fileName, mimeType: input.mimeType, sizeBytes: input.sizeBytes }); await createReviewRequest({ organizationId: org.organization.id, evidenceId, requestedByUserId: ctx.user.id }); return evidenceId; }) }),
  reviews: router({
    decide: protectedProcedure.input(z.object({ reviewId: z.number().int().positive(), status: z.enum(["aprovada", "rejeitada"]), note: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); if (!canReviewEvidence(org.membership.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não pode revisar evidências." }); await decideReviewRequest({ reviewId: input.reviewId, organizationId: org.organization.id, reviewerUserId: ctx.user.id, status: input.status, note: input.note }); return { success: true } as const; }),
    assignResponsible: protectedProcedure.input(z.object({ reviewId: z.number().int().positive(), reviewerUserId: z.number().int().positive().nullable() })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); requireTeamManager(org.membership.role); await assignReviewResponsible({ ...input, organizationId: org.organization.id }); return { success: true } as const; }),
  }),
  team: router({
    members: protectedProcedure.query(async ({ ctx }) => { const org = await getRequiredOrganization(ctx.user.id); return getTeamOverview(org.organization.id); }),
    invites: protectedProcedure.query(async ({ ctx }) => { const org = await getRequiredOrganization(ctx.user.id); requireTeamManager(org.membership.role); return getTeamOverview(org.organization.id); }),
    createInvite: protectedProcedure.input(z.object({ email: z.string().trim().email().max(320), role: invitationRole, origin: safeOrigin })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); requireTeamManager(org.membership.role); const email = normalizeInvitationEmail(input.email); if (await getMemberOfOrganizationByEmail(org.organization.id, email)) throw new Error("Este e-mail já é membro da organização."); const token = randomBytes(32).toString("base64url"); const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); const inviteId = await createOrganizationInvite({ organizationId: org.organization.id, email, role: input.role, tokenHash: hashInviteToken(token), createdByUserId: ctx.user.id, expiresAt }); return { inviteId, invitationUrl: `${input.origin}/convites/${token}`, expiresAt }; }),
    revokeInvite: protectedProcedure.input(z.object({ inviteId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const org = await getRequiredOrganization(ctx.user.id); requireTeamManager(org.membership.role); await revokeOrganizationInvite({ ...input, organizationId: org.organization.id }); return { success: true } as const; }),
  }),
  invitations: router({
    preview: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).query(async ({ input }) => { const item = await getInviteByHash(hashInviteToken(input.token)); if (!item) return { available: false, organizationName: null, role: null }; return { available: item.invite.status === "pendente" && item.invite.expiresAt.getTime() > Date.now(), organizationName: item.organization.name, role: item.invite.role }; }),
    accept: protectedProcedure.input(z.object({ token: z.string().min(20).max(200) })).mutation(async ({ ctx, input }) => { if (!ctx.user.email) throw new Error("Sua conta precisa ter um e-mail para aceitar o convite."); return acceptOrganizationInvite({ tokenHash: hashInviteToken(input.token), userId: ctx.user.id, email: normalizeInvitationEmail(ctx.user.email) }); }),
  }),
});

export type AppRouter = typeof appRouter;
