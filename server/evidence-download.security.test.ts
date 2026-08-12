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

  it("does not let the generic storage proxy sign organization document keys", () => {
    const proxy = fs.readFileSync(path.join(root, "server", "_core", "storageProxy.ts"), "utf8");
    expect(proxy).toContain('key.startsWith("organizations/")');
    expect(proxy).toContain('res.status(404).send("Not found")');
  });

  it("keeps an API rate limit in front of tRPC procedures", () => {
    const server = fs.readFileSync(path.join(root, "server", "_core", "index.ts"), "utf8");
    expect(server).toContain("function apiRateLimit");
    expect(server).toContain('app.use(\n    "/api/trpc",\n    apiRateLimit');
    expect(server).toContain("entry.count > 120");
  });

  it("keeps the pilot private by allowing organization creation only for the project owner", () => {
    const router = fs.readFileSync(path.join(root, "server", "routers.ts"), "utf8");
    expect(router).toContain("ctx.user.openId !== ENV.ownerOpenId");
    expect(router).toContain("O piloto é privado; solicite um convite ao administrador.");
  });
});
