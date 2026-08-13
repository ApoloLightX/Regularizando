import { describe, expect, it } from "vitest";
import { randomUUID } from "crypto";

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

  it.skipIf(process.env.SUPABASE_VALIDATE_WRITE !== "1")("grava uma sonda técnica minimizada somente quando a validação explícita é solicitada", async () => {
    const baseUrl = process.env.SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const response = await fetch(`${baseUrl}/rest/v1/regularizando_governance_events`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: randomUUID(),
        source_event_id: `credential-write-probe:${randomUUID()}`,
        category: "integration",
        action: "CREDENTIAL_WRITE_PROBE",
        entity_type: "supabase_connection",
        metadata: { probe: true, containsCustomerData: false },
        occurred_at: new Date().toISOString(),
      }),
    });
    expect(response.status, "A chave configurada deve ser uma service_role capaz de gravar no livro-razão.").toBe(201);
  });
});
