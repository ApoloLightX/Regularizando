import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";
import { afterEach } from "vitest";

const db = vi.hoisted(() => ({
  acceptOrganizationInvite: vi.fn(),
  assertEntityBelongsToOrganization: vi.fn(),
  assignCapaResponsible: vi.fn(),
  assignReviewResponsible: vi.fn(),
  createCapaAction: vi.fn(),
  createAuditEvent: vi.fn(),
  createCondition: vi.fn(),
  createEsgMetric: vi.fn(),
  createEvidence: vi.fn(),
  createIncident: vi.fn(),
  createLicense: vi.fn(),
  createOrganizationForUser: vi.fn(),
  createOrganizationInvite: vi.fn(),
  createReviewRequest: vi.fn(),
  createSite: vi.fn(),
  decideReviewRequest: vi.fn(),
  getDashboardData: vi.fn(),
  getEvidenceForOrganization: vi.fn(),
  getInviteByHash: vi.fn(),
  getMemberOfOrganizationByEmail: vi.fn(),
  getOrganizationForUser: vi.fn(),
  getTeamOverview: vi.fn(),
  revokeOrganizationInvite: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("./storage", () => ({ storagePut: vi.fn(), storageGetSignedUrl: vi.fn() }));

import { appRouter } from "./routers";
import { storageGetSignedUrl } from "./storage";

const organization = { id: 7, name: "Operação EHS", slug: "operacao-ehs", sector: "telecom", createdAt: new Date(), updatedAt: new Date() };
const originalOwnerOpenId = ENV.ownerOpenId;

function context(role: "owner" | "admin" | "analyst" | "reviewer" | "viewer" = "owner", email = "owner@empresa.com") {
  return {
    user: { id: 11, openId: "user-11", email, name: "Pessoa de Teste", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} },
    res: { clearCookie: vi.fn() },
  } as unknown as TrpcContext;
}

function workspace(role: "owner" | "admin" | "analyst" | "reviewer" | "viewer" = "owner") {
  return { organization, membership: { id: 3, organizationId: 7, userId: 11, role, createdAt: new Date() } };
}

describe("team and assignment procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.getOrganizationForUser.mockResolvedValue(workspace());
    db.getMemberOfOrganizationByEmail.mockResolvedValue(undefined);
    db.createOrganizationInvite.mockResolvedValue(91);
    db.getTeamOverview.mockResolvedValue({ members: [], invites: [] });
    db.revokeOrganizationInvite.mockResolvedValue(undefined);
    db.assignCapaResponsible.mockResolvedValue(undefined);
    db.assignReviewResponsible.mockResolvedValue(undefined);
    db.getEvidenceForOrganization.mockResolvedValue({ id: 90, organizationId: 7, fileKey: "organizations/7/licenca/arquivo.pdf" });
  });

  afterEach(() => { ENV.ownerOpenId = originalOwnerOpenId; });

  it("creates a scoped invitation URL and stores only a normalized email plus token hash", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.team.createInvite({ email: "  Revisor@Empresa.com ", role: "reviewer", origin: "https://app.example" });
    expect(result.invitationUrl).toMatch(/^https:\/\/app\.example\/convites\//);
    expect(db.createOrganizationInvite).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 7, email: "revisor@empresa.com", role: "reviewer", tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "INVITE_CREATED", resourceType: "organization_invite", resourceId: 91, organizationId: 7 }));
  });

  it("revokes an invitation only through an organization manager", async () => {
    const caller = appRouter.createCaller(context("admin"));
    db.getOrganizationForUser.mockResolvedValue(workspace("admin"));
    await expect(caller.team.revokeInvite({ inviteId: 91 })).resolves.toEqual({ success: true });
    expect(db.revokeOrganizationInvite).toHaveBeenCalledWith({ inviteId: 91, organizationId: 7 });
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "INVITE_REVOKED", resourceType: "organization_invite", resourceId: 91, organizationId: 7 }));
  });

  it("accepts an invitation with the authenticated email", async () => {
    const caller = appRouter.createCaller(context("viewer", "convidado@empresa.com"));
    db.acceptOrganizationInvite.mockResolvedValue(organization);
    await expect(caller.invitations.accept({ token: "a-valid-invitation-token-with-enough-length" })).resolves.toMatchObject({ id: 7, name: "Operação EHS" });
    expect(db.acceptOrganizationInvite).toHaveBeenCalledWith(expect.objectContaining({ userId: 11, email: "convidado@empresa.com", tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "INVITE_ACCEPTED", organizationId: 7, resourceType: "organization", resourceId: 7 }));
  });

  it("records the creation of an organization by the private-pilot administrator", async () => {
    ENV.ownerOpenId = "user-11";
    db.getOrganizationForUser.mockResolvedValue(undefined);
    db.createOrganizationForUser.mockResolvedValue(organization);
    const caller = appRouter.createCaller(context());
    await expect(caller.organization.create({ name: "Operação EHS", sector: "telecom" })).resolves.toMatchObject({ id: 7 });
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "ORGANIZATION_CREATED", organizationId: 7, resourceType: "organization", resourceId: 7 }));
  });

  it("renders an unavailable preview when an invitation token does not exist", async () => {
    const caller = appRouter.createCaller(context());
    db.getInviteByHash.mockResolvedValue(undefined);
    await expect(caller.invitations.preview({ token: "an-invalid-token-that-is-long-enough-to-validate" })).resolves.toEqual({ available: false, organizationName: null, role: null });
  });

  it("assigns named members to a CAPA and a pending review", async () => {
    const caller = appRouter.createCaller(context("owner"));
    await expect(caller.capa.assignResponsible({ capaId: 44, responsibleUserId: 33 })).resolves.toEqual({ success: true });
    await expect(caller.reviews.assignResponsible({ reviewId: 55, reviewerUserId: 34 })).resolves.toEqual({ success: true });
    expect(db.assignCapaResponsible).toHaveBeenCalledWith({ capaId: 44, responsibleUserId: 33, organizationId: 7 });
    expect(db.assignReviewResponsible).toHaveBeenCalledWith({ reviewId: 55, reviewerUserId: 34, organizationId: 7 });
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "ACTION_RESPONSIBLE_ASSIGNED", resourceType: "capa", resourceId: 44 }));
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "REVIEW_RESPONSIBLE_ASSIGNED", resourceType: "review", resourceId: 55 }));
  });

  it("records the human decision made on an evidence review", async () => {
    const caller = appRouter.createCaller(context("reviewer"));
    db.getOrganizationForUser.mockResolvedValue(workspace("reviewer"));
    await expect(caller.reviews.decide({ reviewId: 56, status: "aprovada", note: "Documento conferido." })).resolves.toEqual({ success: true });
    expect(db.decideReviewRequest).toHaveBeenCalledWith(expect.objectContaining({ reviewId: 56, organizationId: 7, reviewerUserId: 11, status: "aprovada" }));
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "EVIDENCE_REVIEW_DECIDED", resourceType: "review", resourceId: 56, organizationId: 7 }));
  });

  it("rejects team management and assignments for an analyst", async () => {
    const caller = appRouter.createCaller(context("analyst"));
    db.getOrganizationForUser.mockResolvedValue(workspace("analyst"));
    await expect(caller.team.createInvite({ email: "novo@empresa.com", role: "viewer", origin: "https://app.example" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.capa.assignResponsible({ capaId: 44, responsibleUserId: 33 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.reviews.assignResponsible({ reviewId: 55, reviewerUserId: 34 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not issue a download URL for an evidence outside the active organization", async () => {
    const caller = appRouter.createCaller(context());
    db.getEvidenceForOrganization.mockRejectedValue(new Error("A evidência não pertence à organização atual."));
    await expect(caller.evidences.download({ evidenceId: 999 })).rejects.toThrow("não pertence à organização atual");
    expect(storageGetSignedUrl).not.toHaveBeenCalled();
  });

  it("reads dashboard data only with the active organization identifier", async () => {
    const caller = appRouter.createCaller(context());
    db.getDashboardData.mockResolvedValue({ sites: [], licenses: [], conditions: [], capaActions: [], incidents: [], esgMetrics: [], evidences: [], reviews: [] });
    await expect(caller.dashboard.overview()).resolves.toMatchObject({ organization: { id: 7 } });
    expect(db.getDashboardData).toHaveBeenCalledWith(7);
    expect(db.getDashboardData).not.toHaveBeenCalledWith(8);
  });

  it("rejects foreign sites and licenses before creating linked records", async () => {
    const caller = appRouter.createCaller(context());
    db.assertEntityBelongsToOrganization.mockRejectedValue(new Error("O recurso não pertence à organização atual."));
    await expect(caller.licenses.create({ title: "Licença externa", licenseType: "LO", siteId: 901 })).rejects.toThrow("não pertence à organização atual");
    await expect(caller.conditions.create({ title: "Condicionante externa", licenseId: 902 })).rejects.toThrow("não pertence à organização atual");
    await expect(caller.incidents.create({ title: "Incidente externo", incidentType: "ambiental", severity: "alta", occurredAt: Date.now(), siteId: 903 })).rejects.toThrow("não pertence à organização atual");
    expect(db.createLicense).not.toHaveBeenCalled();
    expect(db.createCondition).not.toHaveBeenCalled();
    expect(db.createIncident).not.toHaveBeenCalled();
  });

  it("rejects evidence links and review decisions from another organization", async () => {
    const caller = appRouter.createCaller(context("reviewer"));
    db.getOrganizationForUser.mockResolvedValue(workspace("reviewer"));
    db.assertEntityBelongsToOrganization.mockRejectedValue(new Error("O recurso não pertence à organização atual."));
    await expect(caller.evidences.upload({ entityType: "licenca", entityId: 904, fileName: "laudo.pdf", mimeType: "application/pdf", sizeBytes: 3, base64: "YWJj" })).rejects.toThrow("não pertence à organização atual");
    db.decideReviewRequest.mockRejectedValue(new Error("A revisão não pertence à organização atual."));
    await expect(caller.reviews.decide({ reviewId: 905, status: "aprovada" })).rejects.toThrow("não pertence à organização atual");
    expect(db.createEvidence).not.toHaveBeenCalled();
  });

  it("rejects responsibility changes when the target action or review belongs to another organization", async () => {
    const caller = appRouter.createCaller(context("owner"));
    db.assignCapaResponsible.mockRejectedValue(new Error("A ação não pertence à organização atual."));
    db.assignReviewResponsible.mockRejectedValue(new Error("A revisão não pertence à organização atual."));
    await expect(caller.capa.assignResponsible({ capaId: 906, responsibleUserId: 22 })).rejects.toThrow("não pertence à organização atual");
    await expect(caller.reviews.assignResponsible({ reviewId: 907, reviewerUserId: 22 })).rejects.toThrow("não pertence à organização atual");
  });
});
