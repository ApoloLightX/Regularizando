import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("LGPD governance interface", () => {
  it("exposes the protected governance route and its administrative flows", () => {
    const app = fs.readFileSync(path.join(root, "client", "src", "App.tsx"), "utf8");
    const page = fs.readFileSync(path.join(root, "client", "src", "pages", "DataGovernance.tsx"), "utf8");
    const navigation = fs.readFileSync(path.join(root, "client", "src", "components", "DashboardLayout.tsx"), "utf8");
    expect(app).toContain('path={"/governanca-lgpd"}');
    expect(navigation).toContain('label: "Governança LGPD"');
    expect(page).toContain("trpc.dataGovernance.setRetentionPolicy");
    expect(page).toContain("trpc.dataGovernance.createSubjectRequest");
    expect(page).toContain("trpc.dataGovernance.handleSubjectRequest");
    expect(page).toContain("trpc.dataGovernance.recordSubjectRequestEvent");
  });

  it("states that deletion is never automatic", () => {
    const page = fs.readFileSync(path.join(root, "client", "src", "pages", "DataGovernance.tsx"), "utf8");
    expect(page).toContain("Nenhuma exclusão automática");
    expect(page).toContain("revisão humana");
    expect(page).toContain("referência pseudonimizada");
    expect(page).toContain("Baseline da plataforma e política da organização");
    expect(page).toContain("Exige revisão jurídica antes de clientes");
  });

  it("records immutable policy snapshots whenever a retention policy is updated", () => {
    const schema = fs.readFileSync(path.join(root, "drizzle", "schema.ts"), "utf8");
    const db = fs.readFileSync(path.join(root, "server", "db.ts"), "utf8");
    expect(schema).toContain("dataRetentionPolicyVersions");
    expect(db).toContain("versionNumber: (latestVersion?.versionNumber ?? 0) + 1");
    expect(db).toContain("recordedByUserId: input.recordedByUserId");
  });

  it("keeps subject-request evidence as scoped references instead of file bytes", () => {
    const schema = fs.readFileSync(path.join(root, "drizzle", "schema.ts"), "utf8");
    const router = fs.readFileSync(path.join(root, "server", "routers.ts"), "utf8");
    expect(schema).toContain("dataSubjectRequestEvents");
    expect(schema).toContain("evidenceReference");
    expect(router).toContain("recordSubjectRequestEvent");
    expect(router).toContain("DATA_SUBJECT_REQUEST_EVENT_RECORDED");
  });
});
