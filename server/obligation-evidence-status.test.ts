import { describe, expect, it } from "vitest";
import { deriveObligationEvidenceStatus } from "./db";

describe("deriveObligationEvidenceStatus", () => {
  it("mantém ausência quando ainda não existe evidência vinculada", () => {
    expect(deriveObligationEvidenceStatus([])).toBe("ausente");
  });

  it("mantém o estado enviado enquanto uma revisão humana estiver pendente", () => {
    expect(deriveObligationEvidenceStatus(["verificada", "enviada"])).toBe("enviada");
  });

  it("só marca como verificada quando todas as evidências vinculadas foram aprovadas", () => {
    expect(deriveObligationEvidenceStatus(["verificada", "verificada"])).toBe("verificada");
  });

  it("marca como rejeitada quando todos os vínculos foram rejeitados", () => {
    expect(deriveObligationEvidenceStatus(["rejeitada", "rejeitada"])).toBe("rejeitada");
  });
});
