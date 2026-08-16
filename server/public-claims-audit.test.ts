import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const page = (name: string) => fs.readFileSync(path.join(root, "client", "src", "pages", name), "utf8");

describe("auditoria de alegações públicas", () => {
  it("preserves limites explícitos em demonstração, produto, piloto, implantação, segurança e privacidade", () => {
    const demo = page("Demo.tsx");
    const product = page("Product.tsx");
    const pilot = page("PilotTelecom.tsx");
    const implementation = page("ImplementationSuccess.tsx");
    const security = page("Security.tsx");
    const privacy = page("PrivacyNotice.tsx");

    expect(demo).toContain("simulação navegável");
    expect(demo).toContain("não é uma prévia de dados reais");
    expect(product).toContain("Não apresenta integração, precisão de extração, prazo de implantação ou resultado de cliente");
    expect(product).toContain("Maturidade declarada, sem confundir código com resultado de cliente.");
    expect(pilot).toContain("não há SLA ou resultado padrão declarado nesta página");
    expect(pilot).toContain("Nenhuma porcentagem, tempo poupado, taxa de extração ou ganho operacional é prometido");
    expect(implementation).toContain("Não há prazo padrão, SLA, equipe dedicada, métrica de economia");
    expect(security).toContain("Não afirma certificações, pentests, SLA, antivírus ou RPO/RTO");
    expect(privacy).toContain("Revisão jurídica pendente antes de clientes");
  });

  it("does not introduce invented customer proof into commercial public routes", () => {
    const commercial = ["Home.tsx", "Product.tsx", "PilotTelecom.tsx", "ImplementationSuccess.tsx", "UseCases.tsx"].map(page).join("\n").toLowerCase();
    expect(commercial).not.toContain("clientes atendidos");
    expect(commercial).not.toContain("depoimento de cliente");
    expect(commercial).not.toContain("case de sucesso");
    expect(commercial).not.toContain("resultado comprovado de cliente");
  });
});
