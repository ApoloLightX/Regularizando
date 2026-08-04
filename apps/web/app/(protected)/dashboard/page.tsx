import { redirect } from "next/navigation";

import { ProductPage, Panel } from "@/components/product-page";
import { resolveOrganization } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string; success?: string }>;
}) {
  const query = await searchParams;
  const { organizations, selected } = await resolveOrganization(query.org);

  if (!selected) redirect("/onboarding");

  const supabase = await createClient();
  const [projects, processes, members] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", selected.id),
    supabase
      .from("licensing_processes")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", selected.id),
    supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", selected.id),
  ]);

  const cards = [
    { label: "Projetos", value: projects.count ?? 0 },
    { label: "Processos", value: processes.count ?? 0 },
    { label: "Pessoas", value: members.count ?? 0 },
  ];

  return (
    <ProductPage
      title={selected.name}
      description="Visão operacional da organização e ponto de partida do fluxo de licenciamento."
      error={query.error}
      success={query.success}
      actions={
        organizations.length > 1 ? (
          <form action="/dashboard">
            <select
              name="org"
              defaultValue={selected.id}
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            <button className="ml-2 text-sm text-primary" type="submit">
              Trocar
            </button>
          </form>
        ) : null
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Panel key={card.label} title={card.label}>
            <p className="text-4xl font-semibold tracking-tight">
              {card.value}
            </p>
          </Panel>
        ))}
      </div>
      <div className="mt-6">
        <Panel
          title="Próxima etapa"
          description="Crie um projeto e registre o primeiro processo de licenciamento. O pipeline documental entra na Fase 3."
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Esta entrega já mantém organização, projeto, processo e trilha de
            auditoria sob o mesmo isolamento multi-tenant.
          </p>
        </Panel>
      </div>
    </ProductPage>
  );
}
