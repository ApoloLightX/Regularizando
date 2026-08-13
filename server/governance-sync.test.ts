import { describe, expect, it } from "vitest";
import { buildGovernanceEventReplica, classifyProcedureMutation, sanitizeGovernanceMetadata, summarizeMutationInput } from "./governance-sync";

describe("trilha de governança", () => {
  it("classifica a captura pública de piloto como evento de lead", () => {
    expect(classifyProcedureMutation("pilot.request")).toEqual({
      category: "lead",
      action: "LEAD_CAPTURED",
      entityType: "pilot_request",
    });
  });

  it("remove dados pessoais, segredos e conteúdo documental dos metadados replicados", () => {
    expect(sanitizeGovernanceMetadata({
      email: "contato@empresa.com",
      name: "Pessoa Exemplo",
      token: "segredo",
      challenge: "conteúdo comercial privado",
      fileKey: "organizations/1/private.pdf",
      sector: "telecom",
      reviewStatus: "pendente",
    })).toEqual({ sector: "telecom", reviewStatus: "pendente" });
  });

  it("registra somente os nomes dos campos enviados por um procedimento", () => {
    expect(summarizeMutationInput({ email: "contato@empresa.com", consent: true, challenge: "privado" })).toEqual({
      inputFields: ["challenge", "consent", "email"],
    });
  });

  it("projeta a réplica externa sem PII, segredos ou conteúdo de documento", () => {
    const replica = buildGovernanceEventReplica({
      eventId: "event-1",
      sourceEventKey: "source-1",
      category: "cybersecurity",
      action: "INTEGRATION_CREDENTIAL_ROTATED",
      entityType: "server_integration",
      entityId: "supabase",
      organizationId: 12,
      actorUserId: 8,
      metadata: JSON.stringify({ email: "private@example.com", token: "secret", fileKey: "private.pdf", secretUpdated: true, integration: "supabase" }),
      occurredAt: new Date("2026-08-13T22:00:00.000Z"),
    });
    expect(replica).toMatchObject({ organization_ref: "organization:12", actor_ref: "user:8", metadata: { secretUpdated: true, integration: "supabase" } });
    expect(JSON.stringify(replica)).not.toContain("private@example.com");
    expect(JSON.stringify(replica)).not.toContain("private.pdf");
    expect(JSON.stringify(replica)).not.toContain("secret\"");
  });
});
