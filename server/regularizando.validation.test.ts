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

  it("checks image signatures and declared extensions", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(() => validateEvidenceUpload({ mimeType: "image/png", fileName: "registro.png", sizeBytes: png.length, bytes: png })).not.toThrow();
    const invalidPng = Buffer.from("not-png");
    expect(() => validateEvidenceUpload({ mimeType: "image/png", fileName: "registro.png", sizeBytes: invalidPng.length, bytes: invalidPng })).toThrow("assinatura");
    expect(() => validateEvidenceUpload({ mimeType: "image/jpeg", fileName: "registro.exe", sizeBytes: 3, bytes: Buffer.from([0xff, 0xd8, 0xff]) })).toThrow("allowlist");
  });

  it("rejects invalid Office ZIP containers before human authorization", () => {
    const malformedOffice = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    expect(() => validateEvidenceUpload({ mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName: "evidencia.docx", sizeBytes: malformedOffice.length, bytes: malformedOffice })).toThrow("container Office");
  });
});
