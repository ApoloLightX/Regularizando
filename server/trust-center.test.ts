import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Trust Center", () => {
  it("states implemented, validation and planned controls without unsupported claims", () => {
    const page = fs.readFileSync(path.join(import.meta.dirname, "..", "client", "src", "pages", "Security.tsx"), "utf8");
    expect(page).toContain("Trust Center");
    expect(page).toContain('"Implementado"');
    expect(page).toContain('"Em validação"');
    expect(page).toContain('"Planejado"');
    expect(page).toContain("não declara varredura antivírus");
    expect(page).toContain("Não afirma certificações, pentests, SLA, antivírus ou RPO/RTO");
  });

  it("links to protected technical validation without making its route public", () => {
    const page = fs.readFileSync(path.join(import.meta.dirname, "..", "client", "src", "pages", "Security.tsx"), "utf8");
    const meta = fs.readFileSync(path.join(import.meta.dirname, "..", "shared", "siteMeta.ts"), "utf8");
    expect(page).toContain('href="/validacao-tecnica"');
    expect(page).toContain("permanece protegida");
    expect(meta).toContain('"/validacao-tecnica"');
  });
});
