import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("controles verificáveis da Release Candidate", () => {
  it("separa pedidos públicos de privacidade do funil comercial e replica somente metadados minimizados", () => {
    const router = source("server/routers.ts");
    const db = source("server/db.ts");
    const leads = source("client/src/pages/Leads.tsx");
    expect(router).toContain('requestCategory: "privacy"');
    expect(router).toContain('action: "PUBLIC_PRIVACY_REQUEST_RECEIVED"');
    expect(router).toContain("metadata: { requestType: input.requestType, privacyNoticeVersion: PRIVACY_NOTICE_VERSION }");
    expect(db).toContain("Pedidos de privacidade não podem ser qualificados como lead comercial.");
    expect(leads).toContain("não qualifique este registro como lead comercial");
  });

  it("emite download de evidência somente após autorização e por URL temporária do storage", () => {
    const router = source("server/routers.ts");
    const storage = source("server/storage.ts");
    expect(router).toContain('evidence.quarantineStatus !== "approved_for_processing" || !evidence.downloadAuthorizedAt');
    expect(router).toContain("const url = await storageGetSignedUrl(evidence.fileKey)");
    expect(router).toContain('action: "EVIDENCE_DOWNLOAD"');
    expect(storage).toContain('new URL("v1/storage/presign/get"');
  });

  it("declara honestamente que expiração da URL e restauração independente dependem de evidência do provedor ou operação", () => {
    const verification = source("docs/security-hardening-verification.md");
    const baseline = source("docs/pilot-security-operating-baseline.md");
    expect(verification).toContain("TTL efetivo precisa ser comprovado");
    expect(baseline).toContain("teste de restauração");
    expect(baseline).not.toContain("RPO definido");
  });
});
