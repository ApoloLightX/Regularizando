import { describe, expect, it } from "vitest";
import { canDecideAssignedReview, canManageTeam, canReviewEvidence, normalizeInvitationEmail, rejectCrossTenantReference, requireWorkspaceContext } from "./regularizando.policy";

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
  });

  it("restricts an assigned review to the named reviewer", () => {
    expect(canDecideAssignedReview(null, 12)).toBe(true);
    expect(canDecideAssignedReview(12, 12)).toBe(true);
    expect(canDecideAssignedReview(12, 24)).toBe(false);
  });

  it("restricts team invitations to owners and organization admins", () => {
    expect(canManageTeam("owner")).toBe(true);
    expect(canManageTeam("admin")).toBe(true);
    expect(canManageTeam("reviewer")).toBe(false);
    expect(canManageTeam("viewer")).toBe(false);
  });

  it("normalizes the email tied to an invitation", () => {
    expect(normalizeInvitationEmail("  EHS@Empresa.com ")).toBe("ehs@empresa.com");
  });
});
