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
    expect(home).toContain("72% · 18 de 25 itens documentais");
    expect(home).not.toContain('B<span>/A</span>');
    expect(home).not.toContain("Confiança</dt><dd>94%");
  });

  it("keeps CAPA as secondary terminology, presents GIS as a real-data workflow and exposes the full operating flow without JavaScript", () => {
    const home = source("client/src/pages/Home.tsx");
    const useCases = source("client/src/pages/UseCases.tsx");
    const styles = source("client/src/index.css");
    expect(home).toContain("Uma rotina, sem partes desconectadas");
    expect(home).toContain("Do documento recebido à decisão que você consegue explicar.");
    expect(home).toContain("Reúna o que já existe.");
    expect(home).toContain("Veja o que pede ação agora.");
    expect(home).toContain("Feche a rotina com evidência.");
    expect(home).toContain("Traga mais contexto quando ele ajudar.");
    expect(home).toContain("operational-flow__step");
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

  it("separates ESG from GIS and keeps the pilot scope and coverage metric explicit", () => {
    const home = source("client/src/pages/Home.tsx");
    const product = source("client/src/pages/Product.tsx");
    const pilot = source("client/src/pages/PilotTelecom.tsx");
    expect(product).toContain("Indicadores ambientais e ESG");
    expect(product).toContain("Território e GIS");
    expect(product).not.toContain("Indicadores ambientais, ESG e GIS");
    expect(pilot).toContain("Até 50 sites, ajustado conforme disponibilidade e objetivo do piloto");
    expect(pilot).toContain("Como calculamos: documentos e itens com registro, fonte e revisão");
    expect(home).toContain("Como calculamos?");
    expect(home).toContain("Prévia ilustrativa: 18 de 25 itens aplicáveis com documento, fonte e revisão registrados");
    expect(home).toContain("Portfólio Telecom · SP");
    expect(home).toContain("Esta prévia não contém dados de cliente.");
    expect(home).toContain("Aviso de Privacidade");
  });
});
