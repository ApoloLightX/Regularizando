import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("marketing positioning", () => {
  it("centers the public narrative on the verifiable obligations flow", () => {
    const home = source("client/src/pages/Home.tsx");
    const product = source("client/src/pages/Product.tsx");
    expect(home).toContain("obrigação, requisito, prazo, responsável, evidência, revisão e decisão");
    expect(product).toContain("Núcleo: Licenciamento & Obrigações");
    expect(product).toContain("Obrigação");
    expect(product).toContain("Decisão");
  });

  it("avoids opaque readiness grades and unsupported confidence percentages", () => {
    const home = source("client/src/pages/Home.tsx");
    expect(home).toContain("Prontidão documental");
    expect(home).toContain("72% de cobertura documental");
    expect(home).not.toContain('B<span>/A</span>');
    expect(home).not.toContain("Confiança</dt><dd>94%");
  });

  it("keeps CAPA as secondary terminology and presents GIS as a real-data workflow, not a map claim", () => {
    const home = source("client/src/pages/Home.tsx");
    const useCases = source("client/src/pages/UseCases.tsx");
    const styles = source("client/src/index.css");
    expect(home).toContain("Módulo: Operação & não conformidades");
    expect(home).toContain("Demonstração conceitual");
    expect(home).toContain("Atualização: 12/08/2026");
    expect(home).toContain("Sem localização e fonte vinculadas, nenhuma camada, alerta ou sobreposição é exibida.");
    expect(home).toContain("não uma decisão legal automática");
    expect(home).toContain("territory-guide__step");
    expect(home).toContain("Ativo identificado");
    expect(home).toContain("Camadas com origem");
    expect(home).toContain("Leitura para revisão");
    expect(styles).toContain(".territory-visual--guided");
    expect(styles).toContain(".territory-visual--guided { padding: 18px; }");
    expect(useCases).toContain("planos de ação");
    expect(useCases).not.toContain("Atribua CAPAs");
  });
});
