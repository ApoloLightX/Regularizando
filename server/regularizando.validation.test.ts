import { describe, expect, it } from "vitest";
import { makeOrganizationSlug, safeEvidenceName, validateEvidenceUpload } from "./regularizando.validation";

describe("regularizando validation", () => {
  it("normalizes organization names into stable slugs", () => {
    expect(makeOrganizationSlug("Operação São Miguel / EHS")).toBe("operacao-sao-miguel-ehs");
  });

  it("makes evidence file keys filesystem-safe", () => {
    expect(safeEvidenceName("Relatório de inspeção #1.pdf")).toBe("Relat-rio-de-inspe-o-1.pdf");
  });

  it("rejects unsupported or oversized evidence files", () => {
    expect(() => validateEvidenceUpload({ mimeType: "text/html", sizeBytes: 48 })).toThrow("Formato não permitido");
    expect(() => validateEvidenceUpload({ mimeType: "application/pdf", sizeBytes: 9 * 1024 * 1024 })).toThrow("até 8 MB");
  });
});
