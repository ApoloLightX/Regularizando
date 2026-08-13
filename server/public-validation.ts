export type ExtractionConfidence = "texto_verificado" | "ocr_exige_conferencia_visual";

export type PublicConditionFinding = {
  conditionCode: string;
  sourceExcerpt: string;
  structuredObligation: string;
  dueText: string | null;
  recurrenceLabel: string | null;
  expectedEvidenceDescription: string | null;
  evidenceBasis: "expressa_na_fonte" | "nao_identificada_na_fonte";
};

const conditionStart = /(?:^|\n)\s*(\d+(?:\.\d+)+(?:\.[a-z])?)\.\s+/gim;

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractDueText(value: string) {
  const normalized = cleanText(value);
  const patterns = [
    /anualmente,?\s+até\s+o\s+mês\s+de\s+[a-zç]+\s+do\s+ano\s+subsequente/i,
    /até\s+o\s+dia\s+\d{1,2}\s+de\s+[a-zç]+\s+de\s+cada\s+ano/i,
    /n(?:o|um)\s+prazo\s+(?:(?:máximo|mínimo)\s+)?de\s+(?:\d+\s*\([^)]*\)|\d+|[a-zç]+)\s+(?:dias?|meses?|anos?)(?:\s+[^.;]*)?/i,
    /em\s+até\s+(?:\d+\s*\([^)]*\)|\d+|[a-zç]+)\s+(?:dias?|meses?|anos?)(?:\s+[^.;]*)?/i,
    /em\s+(?:\d+\s*\([^)]*\)|\d+|[a-zç]+)\s+(?:dias?|meses?|anos?)(?:\s+[^.;]*)?/i,
    /imediatamente\s+após\s+o\s+ocorrido/i,
  ];
  return patterns.map(pattern => normalized.match(pattern)?.[0] ?? null).find(Boolean) ?? null;
}

function extractRecurrence(value: string) {
  const normalized = cleanText(value);
  if (/anualmente|cada\s+ano|relatórios?\s+anuais?/i.test(normalized)) return "anual";
  if (/periódico|periodicamente/i.test(normalized)) return "periódica não quantificada";
  return null;
}

function extractExplicitEvidence(value: string) {
  const normalized = cleanText(value);
  const evidenceMatch = normalized.match(/(?:apresentar|encaminhar|protocolar|submeter)\s+([^.;]{8,260})/i);
  if (!evidenceMatch) return { description: null, basis: "nao_identificada_na_fonte" as const };
  return { description: evidenceMatch[0], basis: "expressa_na_fonte" as const };
}

/** Extrai blocos numerados de qualquer licença ou documento com condicionantes enumeradas; não depende do número da licença. */
export function extractPublicConditionFindings(documentText: string): PublicConditionFinding[] {
  const matches = Array.from(documentText.matchAll(conditionStart));
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? documentText.length) : documentText.length;
    const body = cleanText(documentText.slice(start, end));
    const dueText = extractDueText(body);
    const evidence = extractExplicitEvidence(body);
    return {
      conditionCode: match[1],
      sourceExcerpt: `${match[1]}. ${body}`,
      structuredObligation: body,
      dueText,
      recurrenceLabel: extractRecurrence(body),
      expectedEvidenceDescription: evidence.description,
      evidenceBasis: evidence.basis,
    };
  }).filter(finding => finding.sourceExcerpt.length > 12);
}

export function assertPublicValidationFinding(finding: PublicConditionFinding) {
  if (!finding.conditionCode || !finding.sourceExcerpt || !finding.structuredObligation) throw new Error("Achado público exige código, trecho e obrigação extraída da fonte.");
  if (finding.expectedEvidenceDescription && finding.evidenceBasis !== "expressa_na_fonte") throw new Error("Evidência esperada só pode ser preenchida quando estiver expressa na fonte.");
  return { ...finding, applicabilityStatus: "pendente_revisao_tecnica" as const, reviewStatus: "pendente_revisao_humana" as const };
}
