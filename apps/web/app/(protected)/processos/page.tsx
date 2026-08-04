import { Button } from "@regularizando/ui/components/button";
import { redirect } from "next/navigation";

import { createLicensingProcess } from "@/app/(protected)/actions";
import { Panel, ProductPage, TextField } from "@/components/product-page";
import { resolveOrganization } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

export default async function ProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string; success?: string }>;
}) {
  const query = await searchParams;
  const { selected } = await resolveOrganization(query.org);
  if (!selected) redirect("/onboarding");

  const supabase = await createClient();
  const [projectsResult, processesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name")
      .eq("organization_id", selected.id)
      .order("name"),
    supabase
      .from("licensing_processes")
      .select(
        "id,name,agency,municipality,state,status,created_at,projects(name)",
      )
      .eq("organization_id", selected.id)
      .order("created_at", { ascending: false }),
  ]);

  const projects = projectsResult.data ?? [];
  const processes = processesResult.data ?? [];

  return (
    <ProductPage
      title="Processos de licenciamento"
      description="Cadastre a demanda regulatória que receberá documentos, checklist, análise e score nas próximas fases."
      error={query.error}
      success={query.success}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel title="Processos cadastrados">
          {processes.length ? (
            <div className="grid gap-3">
              {processes.map((process) => (
                <article
                  key={process.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{process.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {process.projects?.[0]?.name ?? "Projeto"}
                        {process.municipality
                          ? ` · ${process.municipality}/${process.state}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {process.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum processo cadastrado.
            </p>
          )}
        </Panel>
        <Panel title="Novo processo">
          {projects.length ? (
            <form action={createLicensingProcess} className="grid gap-4">
              <input type="hidden" name="organizationId" value={selected.id} />
              <label className="grid gap-2 text-sm font-medium">
                Projeto
                <select
                  required
                  name="projectId"
                  className="h-11 rounded-xl border border-border bg-background px-3"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label="Nome do processo" name="name" required />
              <TextField label="Órgão ambiental" name="agency" />
              <div className="grid grid-cols-[1fr_5rem] gap-3">
                <TextField label="Município" name="municipality" />
                <TextField label="UF" name="state" required placeholder="SP" />
              </div>
              <TextField label="Atividade" name="activity" />
              <Button type="submit">Criar processo</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Crie um projeto antes de cadastrar o processo.
            </p>
          )}
        </Panel>
      </div>
    </ProductPage>
  );
}
