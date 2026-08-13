import { describe, expect, it } from "vitest";
import { classifyProcedureMutation, sanitizeGovernanceMetadata, summarizeMutationInput } from "./governance-sync";

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
});
