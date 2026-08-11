import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  acceptOrganizationInvite: vi.fn(),
  assertEntityBelongsToOrganization: vi.fn(),
  assignCapaResponsible: vi.fn(),
  assignReviewResponsible: vi.fn(),
  createCapaAction: vi.fn(),
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
  getInviteByHash: vi.fn(),
  getMemberOfOrganizationByEmail: vi.fn(),
  getOrganizationForUser: vi.fn(),
  getTeamOverview: vi.fn(),
  revokeOrganizationInvite: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { appRouter } from "./routers";

const organization = { id: 7, name: "Operação EHS", slug: "operacao-ehs", sector: "telecom", createdAt: new Date(), updatedAt: new Date() };

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
  });

  it("creates a scoped invitation URL and stores only a normalized email plus token hash", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.team.createInvite({ email: "  Revisor@Empresa.com ", role: "reviewer", origin: "https://app.example" });
    expect(result.invitationUrl).toMatch(/^https:\/\/app\.example\/convites\//);
    expect(db.createOrganizationInvite).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 7, email: "revisor@empresa.com", role: "reviewer", tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
  });

  it("revokes an invitation only through an organization manager", async () => {
    const caller = appRouter.createCaller(context("admin"));
    db.getOrganizationForUser.mockResolvedValue(workspace("admin"));
    await expect(caller.team.revokeInvite({ inviteId: 91 })).resolves.toEqual({ success: true });
    expect(db.revokeOrganizationInvite).toHaveBeenCalledWith({ inviteId: 91, organizationId: 7 });
  });

  it("accepts an invitation with the authenticated email", async () => {
    const caller = appRouter.createCaller(context("viewer", "convidado@empresa.com"));
    db.acceptOrganizationInvite.mockResolvedValue(organization);
    await expect(caller.invitations.accept({ token: "a-valid-invitation-token-with-enough-length" })).resolves.toMatchObject({ id: 7, name: "Operação EHS" });
    expect(db.acceptOrganizationInvite).toHaveBeenCalledWith(expect.objectContaining({ userId: 11, email: "convidado@empresa.com", tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
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
  });

  it("rejects team management and assignments for an analyst", async () => {
    const caller = appRouter.createCaller(context("analyst"));
    db.getOrganizationForUser.mockResolvedValue(workspace("analyst"));
    await expect(caller.team.createInvite({ email: "novo@empresa.com", role: "viewer", origin: "https://app.example" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.capa.assignResponsible({ capaId: 44, responsibleUserId: 33 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.reviews.assignResponsible({ reviewId: 55, reviewerUserId: 34 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
