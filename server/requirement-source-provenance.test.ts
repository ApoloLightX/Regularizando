import { describe, expect, it } from "vitest";
import { assertObligationContextCanProceed, validateRequirementSourceProvenance } from "./db";

describe("validateRequirementSourceProvenance", () => {
  it("rejeita fonte sem classificação de origem ou jurisdição", () => {
    expect(() => validateRequirementSourceProvenance({ officialOriginStatus: "pendente", jurisdiction: "Federal", sourceUrl: "https://www.planalto.gov.br" })).toThrow("origem da fonte");
    expect(() => validateRequirementSourceProvenance({ officialOriginStatus: "oficial", sourceUrl: "https://www.planalto.gov.br" })).toThrow("jurisdição");
  });

  it("rejeita fonte oficial sem URL oficial e aceita documento organizacional rastreável", () => {
    expect(() => validateRequirementSourceProvenance({ officialOriginStatus: "oficial", jurisdiction: "Federal" })).toThrow("URL de origem oficial");
    expect(() => validateRequirementSourceProvenance({ officialOriginStatus: "documento_organizacao", jurisdiction: "Estado de São Paulo", sourceUrl: null })).not.toThrow();
  });

  it("rejeita criação ou decisão de obrigação com fonte incompleta ou conflito pendente", () => {
    const context = { source: { verificationStatus: "verificada", officialOriginStatus: "oficial" as const, sourceUrl: "https://www.planalto.gov.br", jurisdiction: "Federal" }, version: { reviewStatus: "verificada" }, requirement: { applicabilityStatus: "aplicavel_confirmada" }, sourceIsEffective: true, versionIsEffective: true };
    expect(() => assertObligationContextCanProceed({ ...context, source: { ...context.source, jurisdiction: null } }, false)).toThrow("jurisdição");
    expect(() => assertObligationContextCanProceed(context, true)).toThrow("conflito de fonte pendente");
    expect(() => assertObligationContextCanProceed(context, false)).not.toThrow();
  });
});
