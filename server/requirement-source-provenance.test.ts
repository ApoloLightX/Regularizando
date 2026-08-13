import { describe, expect, it } from "vitest";
import { assertObligationContextCanProceed, assertOfficialSourceImportScope, buildImportedOfficialSource, validateRequirementSourceProvenance } from "./db";

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

  it("preserva URL, jurisdição, hierarquia e vigência ao preparar uma fonte oficial para importação", () => {
    const effectiveFrom = new Date("2025-01-01T00:00:00.000Z");
    const effectiveTo = new Date("2027-12-31T00:00:00.000Z");
    const publicationDate = new Date("2025-07-01T00:00:00.000Z");
    const imported = buildImportedOfficialSource({ title: "Lei Geral do Licenciamento Ambiental", issuer: "Planalto", sourceType: "norma", jurisdiction: "Federal", authorityLevel: "federal", identifier: "Lei Federal nº 15.190/2025", sourceVersionLabel: "texto oficial", sourceUrl: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15190.htm", publicationDate, effectiveFrom, effectiveTo }, { organizationId: 7, importedByUserId: 11 });
    expect(imported).toMatchObject({ organizationId: 7, createdByUserId: 11, officialOriginStatus: "oficial", verificationStatus: "em_revisao", jurisdiction: "Federal", authorityLevel: "federal", sourceUrl: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15190.htm", publicationDate, effectiveFrom, effectiveTo });
  });

  it("não permite que uma importação da organização A seja reutilizada pela organização B", () => {
    const importFromOrganizationA = { id: 22, organizationId: 7, catalogSourceId: 8, requirementSourceId: 44 };
    expect(() => assertOfficialSourceImportScope(importFromOrganizationA, 7)).not.toThrow();
    expect(() => assertOfficialSourceImportScope(importFromOrganizationA, 8)).toThrow("não pertence à organização atual");
  });
});
