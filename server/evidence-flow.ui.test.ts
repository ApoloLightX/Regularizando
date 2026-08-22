import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const evidencePage = readFileSync(new URL("../client/src/pages/Evidences.tsx", import.meta.url), "utf8");

describe("fluxo operacional de evidências na interface", () => {
  it("expõe as autorizações humanas separadas de processamento e download", () => {
    expect(evidencePage).toContain("trpc.evidences.authorize.useMutation");
    expect(evidencePage).toContain("Autorizar processamento");
    expect(evidencePage).toContain("Autorizar download");
    expect(evidencePage).toContain('authorization.kind === "processing"');
    expect(evidencePage).toContain("authorizationNote.trim().length < 12");
  });

  it("não apresenta o download como disponível antes das duas autorizações", () => {
    expect(evidencePage).toContain('evidence.quarantineStatus === "approved_for_processing" && downloadAuthorized');
    expect(evidencePage).toContain("disabled={!canDownload || download.isPending}");
    expect(evidencePage).toContain("O download exige revisão, autorização de processamento e autorização separada de download.");
  });

  it("alinha os formatos visíveis de upload com XLSX e CSV aceitos pelo backend", () => {
    expect(evidencePage).toContain("PDF, JPG, PNG, DOCX, XLSX ou CSV de até 8 MB");
    expect(evidencePage).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(evidencePage).toContain('if (extension === "csv") return "text/csv"');
    expect(evidencePage).toContain('if (extension === "xlsx")');
  });

  it("mantém explícito que validação estrutural não equivale a antimalware", () => {
    expect(evidencePage).toContain("validação estrutural não significa arquivo livre de malware");
    expect(evidencePage).toContain("Ela não declara o arquivo como livre de malware.");
  });
});
