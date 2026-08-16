import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const contactPage = readFileSync(new URL("../client/src/pages/Contact.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("formulário público de contato", () => {
  it("valida os campos essenciais antes de chamar a API", () => {
    expect(contactPage).toContain("const validate = () =>");
    expect(contactPage).toContain("Informe um e-mail válido, como nome@empresa.com.");
    expect(contactPage).toContain("Informe o nome da empresa com pelo menos 2 caracteres.");
    expect(contactPage).toContain("É necessário confirmar a leitura do Aviso de Privacidade");
    expect(contactPage).toContain("if (!validate()) return;");
  });

  it("expõe erros em contexto acessível e não usa mais uma falha genérica sem orientação", () => {
    expect(contactPage).toContain('aria-invalid={Boolean(fieldErrors.email)}');
    expect(contactPage).toContain('role="alert"');
    expect(contactPage).toContain("submissionErrorMessage(error.message)");
    expect(contactPage).toContain("Você fez muitas tentativas em pouco tempo.");
    expect(styles).toContain('.pilot-form-card input[aria-invalid="true"]');
    expect(styles).toContain(".field-error");
  });
});
