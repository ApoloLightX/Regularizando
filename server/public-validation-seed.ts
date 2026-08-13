import { and, eq } from "drizzle-orm";
import { publicValidationCases, publicValidationFindings, publicValidationRequirements, publicValidationSources } from "../drizzle/schema";
import { getDb } from "./db";
import { PUBLIC_VALIDATION_CASE, PUBLIC_VALIDATION_FIXTURES } from "./public-validation-fixtures";
import { assertPublicValidationFinding, extractPublicConditionFindings } from "./public-validation";

export async function seedPublicValidationCases() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  await db.insert(publicValidationCases).values(PUBLIC_VALIDATION_CASE).onDuplicateKeyUpdate({ set: { title: PUBLIC_VALIDATION_CASE.title, purpose: PUBLIC_VALIDATION_CASE.purpose, status: "ativo" } });
  const publicCase = (await db.select().from(publicValidationCases).where(eq(publicValidationCases.slug, PUBLIC_VALIDATION_CASE.slug)).limit(1))[0];
  if (!publicCase) throw new Error("Caso público não foi persistido.");

  let sourceCount = 0;
  let findingCount = 0;
  for (const fixture of PUBLIC_VALIDATION_FIXTURES) {
    await db.insert(publicValidationSources).values({
      caseId: publicCase.id,
      slug: fixture.slug,
      title: fixture.title,
      issuer: fixture.issuer,
      documentType: fixture.documentType,
      identifier: fixture.identifier,
      jurisdiction: fixture.jurisdiction,
      sourceUrl: fixture.sourceUrl,
      sourceHash: fixture.sourceHash,
      publicationDate: fixture.publicationDate,
      effectiveFrom: fixture.effectiveFrom,
      effectiveTo: fixture.effectiveTo,
      extractionMethod: fixture.extractionMethod,
      sourceQualityStatus: fixture.sourceQualityStatus,
      importedAt: new Date(),
    }).onDuplicateKeyUpdate({ set: { title: fixture.title, sourceUrl: fixture.sourceUrl, sourceHash: fixture.sourceHash, sourceQualityStatus: fixture.sourceQualityStatus, importedAt: new Date() } });
    const source = (await db.select().from(publicValidationSources).where(eq(publicValidationSources.slug, fixture.slug)).limit(1))[0];
    if (!source) throw new Error("Fonte pública não foi persistida.");
    sourceCount += 1;

    const findings = extractPublicConditionFindings(fixture.documentText)
      .filter(finding => Object.prototype.hasOwnProperty.call(fixture.locators, finding.conditionCode));
    for (const finding of findings) {
      const validated = assertPublicValidationFinding(finding);
      await db.insert(publicValidationFindings).values({
        sourceId: source.id,
        conditionCode: validated.conditionCode,
        sourceLocator: fixture.locators[validated.conditionCode as keyof typeof fixture.locators],
        sourceExcerpt: validated.sourceExcerpt,
        structuredObligation: validated.structuredObligation,
        dueText: validated.dueText,
        recurrenceLabel: validated.recurrenceLabel,
        expectedEvidenceDescription: validated.expectedEvidenceDescription,
        evidenceBasis: validated.evidenceBasis,
        extractionConfidence: fixture.extractionConfidence,
      }).onDuplicateKeyUpdate({ set: { sourceExcerpt: validated.sourceExcerpt, structuredObligation: validated.structuredObligation, dueText: validated.dueText, recurrenceLabel: validated.recurrenceLabel, expectedEvidenceDescription: validated.expectedEvidenceDescription, evidenceBasis: validated.evidenceBasis, extractionConfidence: fixture.extractionConfidence } });
      const resolvedFinding = (await db.select().from(publicValidationFindings).where(and(eq(publicValidationFindings.sourceId, source.id), eq(publicValidationFindings.conditionCode, validated.conditionCode))).limit(1))[0];
      if (!resolvedFinding) throw new Error("Achado público não foi persistido.");
      const code = `PV-${fixture.slug.replace(/^public-/, "").toUpperCase()}-${validated.conditionCode}`;
      await db.insert(publicValidationRequirements).values({
        findingId: resolvedFinding.id,
        code,
        title: `Requisito público de validação — condicionante ${validated.conditionCode}`,
        applicabilityScope: "Caso público de validação técnica; não representa uma obrigação, um ativo ou uma organização privada.",
        applicabilityCriteria: "Aplicabilidade pendente de revisão técnica. Só pode ser avaliada após escopo real confirmado em organização privada, sem reutilizar este caso público.",
        expectedEvidenceDescription: validated.expectedEvidenceDescription,
      }).onDuplicateKeyUpdate({ set: { title: `Requisito público de validação — condicionante ${validated.conditionCode}`, applicabilityScope: "Caso público de validação técnica; não representa uma obrigação, um ativo ou uma organização privada.", applicabilityCriteria: "Aplicabilidade pendente de revisão técnica. Só pode ser avaliada após escopo real confirmado em organização privada, sem reutilizar este caso público.", expectedEvidenceDescription: validated.expectedEvidenceDescription, status: "em_revisao" } });
      findingCount += 1;
    }
  }
  return { caseId: publicCase.id, sourceCount, findingCount };
}
