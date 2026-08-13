import { describe, expect, it } from "vitest";

describe("credenciais de sincronização Supabase", () => {
  it("autentica uma consulta mínima à tabela de auditoria sem revelar segredos", async () => {
    const baseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(baseUrl).toMatch(/^https:\/\//);
    expect(serviceRoleKey?.length).toBeGreaterThan(20);

    const response = await fetch(`${baseUrl}/rest/v1/audit_logs?select=id&limit=1`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey!}`,
      },
    });

    expect(response.status, "A credencial do Supabase deve permitir a consulta mínima de auditoria.").toBe(200);
  });
});
