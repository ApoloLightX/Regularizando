import { describe, expect, it } from "vitest";
import { canReviewEvidence, rejectCrossTenantReference, requireWorkspaceContext } from "./regularizando.policy";

describe("regularizando tenant and approval policy", () => {
  it("fails closed when no workspace is available", () => {
    expect(() => requireWorkspaceContext(undefined)).toThrow("Crie ou entre em uma organização");
  });

  it("rejects a reference that did not resolve inside the active tenant", () => {
    expect(() => rejectCrossTenantReference(false)).toThrow("não pertence à organização atual");
    expect(() => rejectCrossTenantReference(true)).not.toThrow();
  });

  it("permits evidence decisions only to reviewer roles", () => {
    expect(canReviewEvidence("owner")).toBe(true);
    expect(canReviewEvidence("reviewer")).toBe(true);
    expect(canReviewEvidence("analyst")).toBe(false);
    expect(canReviewEvidence("viewer")).toBe(false);
  });
});
