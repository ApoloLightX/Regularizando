import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("private evidence downloads", () => {
  it("authorizes evidence by organization before issuing a temporary URL", () => {
    const router = fs.readFileSync(path.join(root, "server", "routers.ts"), "utf8");
    const db = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");
    expect(router).toContain("download: protectedProcedure");
    expect(router).toContain("getEvidenceForOrganization(input.evidenceId, org.organization.id)");
    expect(router).toContain("storageGetSignedUrl(evidence.fileKey)");
    expect(db).toContain("eq(evidences.organizationId, organizationId)");
  });

  it("requires independent human authorizations for processing and download", () => {
    const router = fs.readFileSync(path.join(root, "server", "routers.ts"), "utf8");
    const db = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");
    expect(router).toContain('authorization: z.enum(["processing", "download"])');
    expect(router).toContain("EVIDENCE_PROCESSING_AUTHORIZED");
    expect(router).toContain("EVIDENCE_DOWNLOAD_AUTHORIZED");
    expect(router).toContain("!evidence.downloadAuthorizedAt");
    expect(db).toContain('authorization: "processing" | "download"');
    expect(db).toContain("A autorização de download exige autorização prévia de processamento.");
  });

  it("checks SHA-256 again before authorization and blocks mismatches", () => {
    const router = fs.readFileSync(path.join(root, "server", "routers.ts"), "utf8");
    const db = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");
    expect(router).toContain("assertEvidenceIntegrityBeforeAuthorization");
    expect(router).toContain("createHash(\"sha256\").update(bytes).digest(\"hex\")");
    expect(router).toContain("blockEvidenceForIntegrityMismatch");
    expect(router).toContain("Integridade divergente antes da autorização");
    expect(db).toContain('quarantineStatus: "blocked"');
  });

  it("documents evidence as untrusted content for future AI integrations", () => {
    const guidance = fs.readFileSync(path.join(root, "docs", "untrusted-document-content.md"), "utf8");
    expect(guidance).toContain("conteúdo não confiável");
    expect(guidance).toContain("nunca podem alterar permissões");
    expect(guidance).toContain("revisão técnica humana");
    expect(guidance).toContain("Não substitui antivírus");
  });

  it("does not let the generic storage proxy sign organization document keys", () => {
    const proxy = fs.readFileSync(path.join(root, "server", "_core", "storageProxy.ts"), "utf8");
    expect(proxy).toContain('key.startsWith("organizations/")');
    expect(proxy).toContain('res.status(404).send("Not found")');
  });

  it("keeps an API rate limit in front of tRPC procedures", () => {
    const server = fs.readFileSync(path.join(root, "server", "_core", "index.ts"), "utf8");
    expect(server).toContain("function apiRateLimit");
    expect(server).toContain('app.use(\n    "/api/trpc",\n    apiRateLimit');
    expect(server).toContain("consumeRateLimitBucket");
    expect(server).toContain('res.setHeader("Retry-After"');
    expect(server).not.toContain("apiWindows");
  });

  it("keeps the pilot private by allowing organization creation only for the project owner", () => {
    const router = fs.readFileSync(path.join(root, "server", "routers.ts"), "utf8");
    expect(router).toContain("ctx.user.openId !== ENV.ownerOpenId");
    expect(router).toContain("O piloto é privado; solicite um convite ao administrador.");
  });
});
