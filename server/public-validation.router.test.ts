import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicValidationOverview, reviewPublicValidationFinding, queueGovernanceEvent, recordProcedureMutation } = vi.hoisted(() => ({
  getPublicValidationOverview: vi.fn(),
  reviewPublicValidationFinding: vi.fn(),
  queueGovernanceEvent: vi.fn(),
  recordProcedureMutation: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), getPublicValidationOverview, reviewPublicValidationFinding }));
vi.mock("./governance-sync", () => ({ queueGovernanceEvent, recordProcedureMutation }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const adminContext = { user: { id: 7, role: "admin", openId: "owner" }, req: {}, res: {} } as unknown as TrpcContext;
const userContext = { user: { id: 8, role: "user", openId: "viewer" }, req: {}, res: {} } as unknown as TrpcContext;

describe("publicValidation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getPublicValidationOverview.mockResolvedValue({ cases: [], sources: [], findings: [] });
    reviewPublicValidationFinding.mockResolvedValue({ id: 91, sourceId: 14, reviewStatus: "aprovada" });
  });

  it("não expõe casos públicos de validação a usuários não administradores", async () => {
    await expect(appRouter.createCaller(userContext).publicValidation.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(adminContext).publicValidation.overview()).resolves.toEqual({ cases: [], sources: [], findings: [] });
  });

  it("registra a decisão humana sem inserir dados de organização ou cliente", async () => {
    await appRouter.createCaller(adminContext).publicValidation.reviewFinding({ findingId: 91, reviewStatus: "aprovada", reviewRationale: "Conferência visual do trecho oficial concluída." });
    expect(reviewPublicValidationFinding).toHaveBeenCalledWith({ findingId: 91, reviewerUserId: 7, reviewStatus: "aprovada", reviewRationale: "Conferência visual do trecho oficial concluída." });
    expect(queueGovernanceEvent).toHaveBeenCalledWith(expect.objectContaining({ category: "data_governance", action: "PUBLIC_VALIDATION_FINDING_REVIEWED", entityType: "public_validation_finding", entityId: 91, actorUserId: 7, metadata: { reviewStatus: "aprovada", sourceId: 14 } }));
  });
});
