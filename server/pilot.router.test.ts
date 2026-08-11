import { beforeEach, describe, expect, it, vi } from "vitest";

const { createPilotRequest } = vi.hoisted(() => ({ createPilotRequest: vi.fn() }));
vi.mock("./db", () => ({ createPilotRequest }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = { user: null, req: {}, res: {} } as unknown as TrpcContext;

describe("pilot.request", () => {
  beforeEach(() => { createPilotRequest.mockReset(); createPilotRequest.mockResolvedValue(91); });

  it("registers a consented commercial request without operational documents", async () => {
    const result = await appRouter.createCaller(ctx).pilot.request({ name: "Ana Silva", email: "ANA@EMPRESA.COM", company: "Empresa Ambiental", sector: "telecom", challenge: "Precisamos centralizar licenças e condicionantes.", consent: true });
    expect(result).toEqual({ id: 91, success: true });
    expect(createPilotRequest).toHaveBeenCalledWith(expect.objectContaining({ email: "ana@empresa.com", consentedAt: expect.any(Date) }));
  });

  it("rejects a request that does not include explicit contact consent", async () => {
    await expect(appRouter.createCaller(ctx).pilot.request({ name: "Ana Silva", email: "ana@empresa.com", company: "Empresa Ambiental", sector: "telecom", consent: false })).rejects.toThrow();
    expect(createPilotRequest).not.toHaveBeenCalled();
  });
});
