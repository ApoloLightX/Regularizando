import { describe, expect, it } from "vitest";
import { PUBLIC_VALIDATION_FIXTURES } from "./public-validation-fixtures";
import { assertPublicValidationFinding, extractPublicConditionFindings } from "./public-validation";
import { publicValidationCases, publicValidationFindings, publicValidationRequirements, publicValidationSources } from "../drizzle/schema";

describe("validação pública do motor de obrigações", () => {
  it("extrai prazos mínimos, prazos sem 'até' e recorrência anual a partir do texto", () => {
    const findings = extractPublicConditionFindings(PUBLIC_VALIDATION_FIXTURES[0].documentText);
    expect(findings.find(finding => finding.conditionCode === "1.8")?.dueText).toMatch(/prazo mínimo de 120/i);
    expect(findings.find(finding => finding.conditionCode === "2.33")?.dueText).toMatch(/em 180 dias/i);
    expect(findings.find(finding => finding.conditionCode === "2.1")).toMatchObject({ recurrenceLabel: "anual" });
  });

  it("opera com o segundo documento sem condicionar a lógica ao número da licença", () => {
    const findings = extractPublicConditionFindings(PUBLIC_VALIDATION_FIXTURES[1].documentText);
    expect(findings.find(finding => finding.conditionCode === "2.15")).toMatchObject({ recurrenceLabel: "anual" });
    expect(findings.find(finding => finding.conditionCode === "2.4.b")?.dueText).toMatch(/270 dias/i);
  });

  it("não permite preencher evidência esperada sem base expressa na fonte", () => {
    expect(() => assertPublicValidationFinding({
      conditionCode: "9.9",
      sourceExcerpt: "9.9. Texto oficial de exemplo suficiente para teste.",
      structuredObligation: "Texto oficial de exemplo suficiente para teste.",
      dueText: null,
      recurrenceLabel: null,
      expectedEvidenceDescription: "Comprovante inventado",
      evidenceBasis: "nao_identificada_na_fonte",
    })).toThrow("Evidência esperada");
  });

  it("mantém toda aplicabilidade e revisão humana como pendentes", () => {
    const parsed = extractPublicConditionFindings(PUBLIC_VALIDATION_FIXTURES[0].documentText)[0];
    expect(assertPublicValidationFinding(parsed)).toMatchObject({ applicabilityStatus: "pendente_revisao_tecnica", reviewStatus: "pendente_revisao_humana" });
  });

  it("não cria prazo ou evidência que não estejam contidos no trecho original", () => {
    for (const fixture of PUBLIC_VALIDATION_FIXTURES) {
      for (const finding of extractPublicConditionFindings(fixture.documentText)) {
        const normalizedExcerpt = finding.sourceExcerpt.toLocaleLowerCase("pt-BR");
        if (finding.dueText) expect(normalizedExcerpt).toContain(finding.dueText.toLocaleLowerCase("pt-BR"));
        if (finding.expectedEvidenceDescription) expect(normalizedExcerpt).toContain(finding.expectedEvidenceDescription.toLocaleLowerCase("pt-BR"));
      }
    }
  });

  it("mantém o domínio público sem chave de organização, ativo ou evidência de cliente", () => {
    expect("organizationId" in publicValidationCases).toBe(false);
    expect("organizationId" in publicValidationSources).toBe(false);
    expect("organizationId" in publicValidationFindings).toBe(false);
    expect("organizationId" in publicValidationRequirements).toBe(false);
    expect(PUBLIC_VALIDATION_FIXTURES.every(fixture => !fixture.documentText.includes("coordenadas"))).toBe(true);
  });

  it("preserva URL oficial, hash, locator e método de extração para cada trecho selecionado", () => {
    for (const fixture of PUBLIC_VALIDATION_FIXTURES) {
      expect(fixture.sourceUrl).toMatch(/^https:\/\/www\.gov\.br\//);
      expect(fixture.sourceHash).toMatch(/^[a-f0-9]{64}$/);
      const selectedFindings = extractPublicConditionFindings(fixture.documentText).filter(finding => Object.prototype.hasOwnProperty.call(fixture.locators, finding.conditionCode));
      expect(selectedFindings).toHaveLength(Object.keys(fixture.locators).length);
      for (const finding of selectedFindings) {
        expect(fixture.locators[finding.conditionCode as keyof typeof fixture.locators]).toMatch(/^página \d+$/);
        expect(finding.sourceExcerpt).toContain(finding.structuredObligation);
      }
    }
  });
});
