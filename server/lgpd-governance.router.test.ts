import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  getOrganizationForUser: vi.fn(),
  createDataSubjectRequest: vi.fn(),
  assignDataSubjectRequest: vi.fn(),
  recordDataSubjectRequestEvent: vi.fn(),
  handleDataSubjectRequest: vi.fn(),
  createAuditEvent: vi.fn(),
}));
const governance = vi.hoisted(() => ({ recordProcedureMutation: vi.fn(), queueGovernanceEvent: vi.fn() }));

vi.mock("./db", async (importOriginal) => ({ ...(await importOriginal<typeof import("./db")>()), ...db }));
vi.mock("./governance-sync", () => governance);

import { appRouter } from "./routers";

const workspace = {
  organization: { id: 7, name: "Operação EHS", slug: "operacao-ehs", sector: "telecom", createdAt: new Date(), updatedAt: new Date() },
  membership: { id: 3, organizationId: 7, userId: 11, role: "owner" as const, createdAt: new Date() },
};

const context = {
  user: { id: 11, openId: "user-11", email: "owner@empresa.com", name: "Pessoa de Teste", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} },
  res: { clearCookie: vi.fn() },
} as unknown as TrpcContext;

describe("dataGovernance operational workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.getOrganizationForUser.mockResolvedValue(workspace);
    db.createDataSubjectRequest.mockResolvedValue(44);
    db.assignDataSubjectRequest.mockResolvedValue({ id: 44, organizationId: 7, assignedToUserId: 12 });
    db.recordDataSubjectRequestEvent.mockResolvedValue(71);
    db.handleDataSubjectRequest.mockResolvedValue({ id: 44, organizationId: 7, status: "executada" });
  });

  it("pseudonymizes a new request and begins its workflow in the nova state", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.dataGovernance.createSubjectRequest({ subjectReference: "Titular@Empresa.com", requestType: "acesso", scopeNote: "Solicitação de acesso aos dados cadastrados no produto." })).resolves.toEqual({ requestId: 44 });
    expect(db.createDataSubjectRequest).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 7, requestType: "acesso", status: "nova", subjectReferenceHash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "DATA_SUBJECT_REQUEST_CREATED", metadata: expect.stringContaining("nova") }));
  });

  it("requires a manager to assign a member and emits an assignment event", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.dataGovernance.assignSubjectRequest({ requestId: 44, assignedToUserId: 12 })).resolves.toEqual(expect.objectContaining({ id: 44 }));
    expect(db.assignDataSubjectRequest).toHaveBeenCalledWith({ requestId: 44, assignedToUserId: 12, organizationId: 7, assignedByUserId: 11 });
    expect(db.recordDataSubjectRequestEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "atribuicao", recordedByUserId: 11 }));
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "DATA_SUBJECT_REQUEST_ASSIGNED" }));
  });

  it("requires an execution record before an authorized user can mark a request executed", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.dataGovernance.handleSubjectRequest({ requestId: 44, status: "executada", decisionRationale: "A solicitação foi revisada pela pessoa responsável." })).rejects.toThrow("A execução exige um registro descritivo.");
    await expect(caller.dataGovernance.handleSubjectRequest({ requestId: 44, status: "executada", decisionRationale: "A solicitação foi revisada pela pessoa responsável.", executionNote: "Exportação preparada e disponibilizada ao titular pelo canal adequado." })).resolves.toEqual(expect.objectContaining({ status: "executada" }));
    expect(db.recordDataSubjectRequestEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "execucao" }));
    expect(db.createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: "DATA_SUBJECT_REQUEST_REVIEWED" }));
  });
});
