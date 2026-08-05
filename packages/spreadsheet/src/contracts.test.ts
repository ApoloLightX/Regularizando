import { describe, expect, it } from "vitest";

import {
  ambiguityRequestSchema,
  ambiguitySchema,
  EXTRACTOR_VERSION,
  proposedCandidateSchema,
  sourceCellSchema,
} from "./index";

const sourceCell = {
  sourceFileId: "import-123",
  sourceSha256: "a".repeat(64),
  sheetIndex: 0,
  sheetName: "Pontos",
  row: 8,
  column: 2,
  address: "B8",
  headerOriginal: "Latitude",
  rawValue: -23.55052,
  safeText: "-23.55052",
  formulaText: null,
};

describe("spreadsheet contracts", () => {
  it("keeps immutable file provenance with every source cell", () => {
    const cell = sourceCellSchema.parse(sourceCell);

    expect(cell.sourceFileId).toBe("import-123");
    expect(cell.sourceSha256).toBe("a".repeat(64));
  });

  it("accepts only canonical A1 addresses", () => {
    expect(sourceCellSchema.safeParse(sourceCell).success).toBe(true);
    expect(sourceCellSchema.safeParse({ ...sourceCell, address: "" }).success).toBe(
      false,
    );
    expect(
      sourceCellSchema.safeParse({ ...sourceCell, address: "linha oito" }).success,
    ).toBe(false);
    expect(sourceCellSchema.safeParse({ ...sourceCell, address: "A0" }).success).toBe(
      false,
    );
  });

  it("keeps formula text separate from its cached value", () => {
    const cell = sourceCellSchema.parse({
      ...sourceCell,
      rawValue: 42,
      safeText: "42",
      formulaText: "=SUM(A2:A3)",
    });

    expect(cell.address).toBe("B8");
    expect(cell.rawValue).toBe(42);
    expect(cell.formulaText).toBe("=SUM(A2:A3)");
    expect(EXTRACTOR_VERSION).toMatch(/^spreadsheet-v\d+$/);
  });

  it("allows only proposed candidates in extraction output", () => {
    expect(
      proposedCandidateSchema.safeParse({
        kind: "coordinate",
        reviewStatus: "proposta",
        confidence: 0.8,
        evidence: [sourceCell],
        alerts: [],
      }).success,
    ).toBe(true);
    expect(
      proposedCandidateSchema.safeParse({
        kind: "coordinate",
        reviewStatus: "confirmada",
        confidence: 0.8,
        evidence: [sourceCell],
        alerts: [],
      }).success,
    ).toBe(false);
  });

  it("requires a durable reservation for the matching ambiguity before resolution", () => {
    const ambiguity = ambiguitySchema.parse({
      id: "ambiguity-sheet-0-table-0",
      state: "attempt_persisted",
      evidence: [sourceCell],
    });
    const input = {
      ambiguityId: ambiguity.id,
      persistedAttempt: {
        id: "attempt-1",
        ambiguityId: ambiguity.id,
        reservationId: "reservation-1",
        number: 1,
        state: "reserved",
        persistedAt: "2026-08-05T00:00:00.000Z",
      },
      headers: ["Latitude"],
      sampleRows: [["-23.55052"]],
      deterministicScores: {
        coordenadas: 0.86,
        monitoramento: 0.79,
        checklist_documental: 0.1,
        tabular_generico: 0.1,
      },
      signals: ["latitude_header"],
    };
    const request = ambiguityRequestSchema.parse(input);

    expect(request.ambiguityId).toBe(ambiguity.id);
    expect(request.persistedAttempt.ambiguityId).toBe(ambiguity.id);
    expect(request.persistedAttempt.reservationId).toBe("reservation-1");
    expect(request.persistedAttempt.number).toBe(1);
    expect(request.persistedAttempt.state).toBe("reserved");
    expect(
      ambiguityRequestSchema.safeParse({
        ...input,
        persistedAttempt: {
          ...input.persistedAttempt,
          ambiguityId: "another-ambiguity",
        },
      }).success,
    ).toBe(false);
  });
});
