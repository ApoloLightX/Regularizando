import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const publicPages = ["Home.tsx", "Product.tsx", "UseCases.tsx", "PilotTelecom.tsx", "ImplementationSuccess.tsx", "Security.tsx", "PrivacyNotice.tsx"];

describe("public accessibility baseline", () => {
  it("provides a main landmark and one primary heading in each public route", () => {
    for (const page of publicPages) {
      const source = fs.readFileSync(path.join(projectRoot, "client", "src", "pages", page), "utf8");
      expect(source, `${page} needs a main landmark`).toMatch(/<main\b/);
      expect(source, `${page} needs a primary heading`).toMatch(/<h1\b/);
    }
  });

  it("keeps a visible keyboard focus treatment for interactive controls", () => {
    const styles = fs.readFileSync(path.join(projectRoot, "client", "src", "index.css"), "utf8");
    expect(styles).toContain("button:focus-visible, a:focus-visible");
    expect(styles).toContain("outline: 2px solid var(--white)");
    expect(styles).toContain("box-shadow: 0 0 0 4px var(--ink)");
  });

  it("uses header, navigation, main and footer landmarks without custom tab order", () => {
    const nav = fs.readFileSync(path.join(projectRoot, "client", "src", "components", "MarketingNav.tsx"), "utf8");
    const footer = fs.readFileSync(path.join(projectRoot, "client", "src", "components", "MarketingFooter.tsx"), "utf8");
    expect(nav).toContain("<header");
    expect(nav).toContain("<nav");
    expect(footer).toContain("<footer");
    expect(footer).toContain("<nav");
    expect(nav).toContain('href="/demonstracao"');
    expect(nav).toContain('href="/implantacao-e-sucesso"');
    expect(footer).toContain('href="/demonstracao"');
    expect(footer).toContain('href="/implantacao-e-sucesso"');
    for (const page of publicPages) {
      const source = fs.readFileSync(path.join(projectRoot, "client", "src", "pages", page), "utf8");
      expect(source).not.toMatch(/tabIndex={[1-9]/);
    }
  });

  it("exposes actionable pilot form labels plus explicit error and success states", () => {
    const source = fs.readFileSync(path.join(projectRoot, "client", "src", "pages", "Contact.tsx"), "utf8");
    expect(source).toContain("<form");
    expect(source).toContain("<label");
    expect(source).toContain('role="alert"');
    expect(source).toContain('role="status"');
    expect(source).toContain("consent");
    expect(source).toContain("/aviso-de-privacidade");
    expect(source).toContain("Privacidade e dados pessoais / LGPD");
  });

  it("keeps the privacy notice visible in public navigation with controller, channel and legal-review limits", () => {
    const page = fs.readFileSync(path.join(projectRoot, "client", "src", "pages", "PrivacyNotice.tsx"), "utf8");
    const footer = fs.readFileSync(path.join(projectRoot, "client", "src", "components", "MarketingFooter.tsx"), "utf8");
    const routes = fs.readFileSync(path.join(projectRoot, "client", "src", "App.tsx"), "utf8");
    const privacy = fs.readFileSync(path.join(projectRoot, "shared", "privacy.ts"), "utf8");
    expect(privacy).toContain("Gabriel Apolo Leal Rocha");
    expect(page).toContain("Revisão jurídica pendente antes de clientes");
    expect(page).toContain("Não vendemos dados pessoais.");
    expect(footer).toContain('href="/aviso-de-privacidade"');
    expect(routes).toContain('path={"/aviso-de-privacidade"}');
  });

  it("keeps public CTAs keyboard-focusable and primary text colors above normal-text contrast", () => {
    const pages = publicPages.map((page) => fs.readFileSync(path.join(projectRoot, "client", "src", "pages", page), "utf8")).join("\n");
    const styles = fs.readFileSync(path.join(projectRoot, "client", "src", "index.css"), "utf8");
    expect(pages).toMatch(/<Link[\s\S]*className="button|<button[\s\S]*className="button/);
    const luminance = (hex: string) => hex.match(/\w\w/g)!.map((part) => Number.parseInt(part, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const ratio = (first: string, second: string) => (Math.max(luminance(first), luminance(second)) + 0.05) / (Math.min(luminance(first), luminance(second)) + 0.05);
    expect(ratio("fbfaf5", "082b2e")).toBeGreaterThan(4.5);
    expect(ratio("244c46", "fbfaf5")).toBeGreaterThan(4.5);
    expect(ratio("082b2e", "78d2b0")).toBeGreaterThan(4.5);
    expect(ratio("082b2e", "c6e8d7")).toBeGreaterThan(4.5);
    expect(ratio("082b2e", "f4f1e8")).toBeGreaterThan(4.5);
    expect(styles).toContain("button:focus-visible, a:focus-visible");
    expect(styles).toContain(".pilot-form-submit:disabled { cursor: not-allowed; color: var(--ink); background: var(--mint-soft); opacity: 1; }");
  });
});
