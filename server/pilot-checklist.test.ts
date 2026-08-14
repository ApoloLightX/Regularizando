import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("pilot activation checklist", () => {
  it("keeps the private-pilot checklist contractual, operational and free of fictional partners", () => {
    const checklist = fs.readFileSync(path.join(import.meta.dirname, "..", "docs", "pilot-activation-checklist.md"), "utf8");
    for (const term of ["DPA", "finalidade", "Dados proibidos", "backup/restauração", "Canal de incidentes", "Encerramento", "Devolução ou exportação"]) expect(checklist).toContain(term);
    expect(checklist).toContain("não confirma a existência de parceiro");
    expect(checklist).toContain("Não há exclusão automática");
  });
});
