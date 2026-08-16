import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("dashboard loading feedback", () => {
  it("uses an informative skeleton rather than an empty loading screen while organization data is requested", () => {
    const dashboard = fs.readFileSync(path.join(root, "client", "src", "pages", "Dashboard.tsx"), "utf8");
    const skeleton = fs.readFileSync(path.join(root, "client", "src", "components", "DashboardDataSkeleton.tsx"), "utf8");
    expect(dashboard).toContain("<DashboardDataSkeleton />");
    expect(dashboard).not.toContain("Carregando seu espaço de trabalho…");
    expect(skeleton).toContain('role="status"');
    expect(skeleton).toContain("Nenhum dado ilustrativo é exibido enquanto a consulta é concluída.");
    expect(skeleton).toContain("metric-grid");
  });
});
