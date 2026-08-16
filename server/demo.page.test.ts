import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const demoPage = readFileSync(new URL("../client/src/pages/Demo.tsx", import.meta.url), "utf8");
const homePage = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");

describe("demonstração pública navegável", () => {
  it("mantém uma cadeia explícita do documento à decisão", () => {
    expect(demoPage).toContain("Documento recebido");
    expect(demoPage).toContain("Leitura assistida");
    expect(demoPage).toContain("Revisão humana");
    expect(demoPage).toContain("Prazo e responsável");
    expect(demoPage).toContain("Evidência controlada");
    expect(demoPage).toContain("Decisão rastreável");
  });

  it("identifica a simulação e não a apresenta como operação ou resultado de cliente", () => {
    expect(demoPage).toContain("simulação navegável");
    expect(demoPage).toContain("inteiramente ilustrativos");
    expect(demoPage).toContain("não representa uma extração em tempo real nem resultado de cliente");
    expect(demoPage).toContain("não substitui uma prova de valor");
  });

  it("substitui o modal superficial por uma rota de demonstração dedicada", () => {
    expect(homePage).toContain('href="/demonstracao"');
    expect(homePage).not.toContain("setDemoOpen");
  });
});
