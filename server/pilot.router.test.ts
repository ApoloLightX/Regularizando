import { beforeEach, describe, expect, it, vi } from "vitest";

const { createPilotRequest, queueGovernanceEvent } = vi.hoisted(() => ({ createPilotRequest: vi.fn(), queueGovernanceEvent: vi.fn() }));
vi.mock("./db", async (importOriginal) => ({ ...(await importOriginal<typeof import("./db")>()), createPilotRequest }));
vi.mock("./governance-sync", async (importOriginal) => ({ ...(await importOriginal<typeof import("./governance-sync")>()), queueGovernanceEvent }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = { user: null, req: {}, res: {} } as unknown as TrpcContext;

describe("pilot.request", () => {
  beforeEach(() => { createPilotRequest.mockReset(); createPilotRequest.mockResolvedValue(91); queueGovernanceEvent.mockReset(); });

  it("registers a consented commercial request without operational documents", async () => {
    const result = await appRouter.createCaller(ctx).pilot.request({ name: "Ana Silva", email: "ANA@EMPRESA.COM", company: "Empresa Ambiental", sector: "telecom", challenge: "Precisamos centralizar licenças e condicionantes.", consent: true });
    expect(result).toEqual({ id: 91, success: true });
    expect(createPilotRequest).toHaveBeenCalledWith(expect.objectContaining({ email: "ana@empresa.com", consentedAt: expect.any(Date) }));
  });

  it("rejects a request that does not include explicit contact consent", async () => {
    await expect(appRouter.createCaller(ctx).pilot.request({ name: "Ana Silva", email: "ana@empresa.com", company: "Empresa Ambiental", sector: "telecom", consent: false })).rejects.toThrow();
    expect(createPilotRequest).not.toHaveBeenCalled();
  });

  it("registers a public privacy request separately from the commercial lead funnel", async () => {
    const result = await appRouter.createCaller(ctx).pilot.privacyRequest({ name: "Ana Silva", email: "ANA@EMPRESA.COM", requestType: "eliminacao", scopeNote: "Solicito análise humana sobre a eliminação dos meus dados de contato.", consent: true });
    expect(result).toEqual({ id: 91, success: true });
    expect(createPilotRequest).toHaveBeenCalledWith(expect.objectContaining({ email: "ana@empresa.com", company: null, requestCategory: "privacy", privacyRequestType: "eliminacao", privacyNoticeVersion: "2026-08-15" }));
    expect(queueGovernanceEvent).toHaveBeenCalledWith(expect.objectContaining({ category: "data_governance", action: "PUBLIC_PRIVACY_REQUEST_RECEIVED", metadata: { requestType: "eliminacao", privacyNoticeVersion: "2026-08-15" } }));
  });
});
