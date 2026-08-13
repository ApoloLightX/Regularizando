import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("GIS mobile layout", () => {
  it("keeps the territorial guide readable at the 700px mobile breakpoint", () => {
    const styles = source("client/src/index.css");
    const territoryMobileRule = ".territory-visual { min-height: 0; }";
    const territoryMobileIndex = styles.indexOf(territoryMobileRule);
    const mobileStart = styles.lastIndexOf("@media (max-width: 700px)", territoryMobileIndex);
    const mobileRules = styles.slice(mobileStart, territoryMobileIndex + 500);
    expect(mobileRules).toContain(".territory-visual { min-height: 0; }");
    expect(mobileRules).toContain(".territory-visual--guided { padding: 18px; }");
    expect(mobileRules).toContain(".territory-guide { padding: 18px; }");
    expect(styles).toContain(".territory-guide__step { display: grid; grid-template-columns: 24px 1fr;");
  });

  it("renders the three-step guide and never presents an active territorial result without inputs", () => {
    const home = source("client/src/pages/Home.tsx");
    expect(home).toContain("Ativo identificado");
    expect(home).toContain("Camadas com origem");
    expect(home).toContain("Leitura para revisão");
    expect(home).toContain("Sem localização e fonte vinculadas, nenhuma camada, alerta ou sobreposição é exibida.");
    expect(home).not.toContain("Raio analisado: 10 km");
    expect(home).not.toContain("2 sobreposições relevantes");
    expect(home).not.toContain("gis-site");
  });
});
