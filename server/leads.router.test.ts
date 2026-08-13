import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPilotRequests, qualifyPilotRequest, queueGovernanceEvent, recordProcedureMutation } = vi.hoisted(() => ({
  getPilotRequests: vi.fn(),
  qualifyPilotRequest: vi.fn(),
  queueGovernanceEvent: vi.fn(),
  recordProcedureMutation: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), getPilotRequests, qualifyPilotRequest }));
vi.mock("./governance-sync", () => ({ queueGovernanceEvent, recordProcedureMutation }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const adminContext = { user: { id: 7, role: "admin", openId: "owner" }, req: {}, res: {} } as unknown as TrpcContext;
const userContext = { user: { id: 8, role: "user", openId: "viewer" }, req: {}, res: {} } as unknown as TrpcContext;

describe("leads", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getPilotRequests.mockResolvedValue([]);
    qualifyPilotRequest.mockResolvedValue({ lead: { id: 22, leadOrigin: "website", qualificationStage: "mql" }, previousStage: "captured" });
  });

  it("restringe a lista de leads a administradores globais", async () => {
    await expect(appRouter.createCaller(userContext).leads.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(adminContext).leads.list()).resolves.toEqual([]);
    expect(getPilotRequests).toHaveBeenCalledOnce();
  });

  it("registra a qualificação com responsável e evento minimizado", async () => {
    const result = await appRouter.createCaller(adminContext).leads.qualify({ pilotRequestId: 22, qualificationStage: "mql", qualificationNote: "Aderência inicial confirmada." });
    expect(result).toMatchObject({ id: 22, qualificationStage: "mql" });
    expect(qualifyPilotRequest).toHaveBeenCalledWith(expect.objectContaining({ pilotRequestId: 22, qualificationStage: "mql", qualifiedByUserId: 7 }));
    expect(queueGovernanceEvent).toHaveBeenCalledWith(expect.objectContaining({ category: "lead", action: "LEAD_QUALIFICATION_CHANGED", entityId: 22, actorUserId: 7, metadata: { previousStage: "captured", qualificationStage: "mql", origin: "website" } }));
  });

  it("preserva o estágio anterior quando um lead é movido de MQL para SQL", async () => {
    qualifyPilotRequest.mockResolvedValueOnce({ lead: { id: 22, leadOrigin: "website", qualificationStage: "sql" }, previousStage: "mql" });
    await appRouter.createCaller(adminContext).leads.qualify({ pilotRequestId: 22, qualificationStage: "sql" });
    expect(queueGovernanceEvent).toHaveBeenCalledWith(expect.objectContaining({ metadata: { previousStage: "mql", qualificationStage: "sql", origin: "website" } }));
  });
});
