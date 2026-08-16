import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const fromRoot = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("identidade Rastro", () => {
  it("mantém um símbolo vetorial independente de bitmap para a marca pública", () => {
    const symbol = fromRoot("client/src/components/RastroBrand.tsx");
    const nav = fromRoot("client/src/components/MarketingNav.tsx");
    const home = fromRoot("client/src/pages/Home.tsx");

    expect(symbol).toContain('viewBox="0 0 48 48"');
    expect(symbol).toContain("três percursos convergem para um ponto de decisão");
    expect(nav).toContain('from "./RastroBrand"');
    expect(home).toContain('from "@/components/RastroBrand"');
    expect(home).not.toContain("regularizando-mark_ccce30b2.png");
  });

  it("aplica o símbolo ao favicon e preserva a paleta petróleo e verde mineral", () => {
    const favicon = fromRoot("client/public/favicon.svg");
    const css = fromRoot("client/src/index.css");

    expect(favicon).toContain('fill="#082b2e"');
    expect(favicon).toContain('stroke="#78d2b0"');
    expect(css).toContain(".eyebrow-rastro");
    expect(css).toContain(".marketing-footer__mark");
  });

  it("documenta que identidade não equivale a promessa de controle ou decisão automática", () => {
    const guidance = fromRoot("docs/rastro-identity.md");

    expect(guidance).toContain("não representa certificação");
    expect(guidance).toContain("não substitui fonte, evidência, revisão humana");
  });
});
