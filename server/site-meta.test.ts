import { describe, expect, it } from "vitest";
import { getSiteMeta } from "../shared/siteMeta";

describe("site metadata", () => {
  it("returns specific indexable metadata for every public commercial route", () => {
    expect(getSiteMeta("/").canonicalPath).toBe("/");
    expect(getSiteMeta("/produto").title).toContain("Plataforma");
    expect(getSiteMeta("/casos-de-uso").title).toContain("Telecom");
    expect(getSiteMeta("/piloto-telecom").title).toContain("Piloto");
    expect(getSiteMeta("/seguranca").canonicalPath).toBe("/seguranca");
    expect(getSiteMeta("/aviso-de-privacidade").canonicalPath).toBe("/aviso-de-privacidade");
  });

  it("keeps private surfaces out of search indexes and responds correctly to unknown paths", () => {
    expect(getSiteMeta("/dashboard").noindex).toBe(true);
    expect(getSiteMeta("/evidencias").noindex).toBe(true);
    expect(getSiteMeta("/obrigacoes").noindex).toBe(true);
    expect(getSiteMeta("/fontes").noindex).toBe(true);
    expect(getSiteMeta("/convites/token-unico").noindex).toBe(true);
    expect(getSiteMeta("/direcoes-de-marca").noindex).toBe(true);
    expect(getSiteMeta("/rota-inexistente").notFound).toBe(true);
  });
});
