import { redirect } from "next/navigation";

import { Panel, ProductPage } from "@/components/product-page";
import { resolveOrganization } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const query = await searchParams;
  const { selected } = await resolveOrganization(query.org);
  if (!selected) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id,action,entity_type,entity_id,actor_id,created_at")
    .eq("organization_id", selected.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <ProductPage
      title="Trilha de auditoria"
      description="Registro somente leitura das alterações críticas realizadas na organização."
    >
      <Panel title="Eventos recentes">
        {data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Ação</th>
                  <th className="pb-3 font-medium">Entidade</th>
                  <th className="pb-3 font-medium">Ator</th>
                  <th className="pb-3 font-medium">Horário</th>
                </tr>
              </thead>
              <tbody>
                {data.map((event) => (
                  <tr key={event.id} className="border-t border-border">
                    <td className="py-3">{event.action}</td>
                    <td className="py-3">{event.entity_type}</td>
                    <td className="py-3 font-mono text-xs">
                      {event.actor_id ?? "sistema"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(event.created_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum evento registrado.
          </p>
        )}
      </Panel>
    </ProductPage>
  );
}
