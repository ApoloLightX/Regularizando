import { Button } from "@regularizando/ui/components/button";
import { redirect } from "next/navigation";

import { createProject } from "@/app/(protected)/actions";
import { Panel, ProductPage, TextField } from "@/components/product-page";
import { resolveOrganization } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string; success?: string }>;
}) {
  const query = await searchParams;
  const { selected } = await resolveOrganization(query.org);
  if (!selected) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id,name,description,status,created_at")
    .eq("organization_id", selected.id)
    .order("created_at", { ascending: false });

  return (
    <ProductPage
      title="Projetos"
      description={`Portfólio ambiental de ${selected.name}.`}
      error={query.error}
      success={query.success}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel title="Projetos cadastrados">
          {data?.length ? (
            <div className="grid gap-3">
              {data.map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-medium">{project.name}</h3>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {project.status}
                    </span>
                  </div>
                  {project.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum projeto cadastrado. Crie o primeiro ao lado.
            </p>
          )}
        </Panel>
        <Panel title="Novo projeto">
          <form action={createProject} className="grid gap-4">
            <input type="hidden" name="organizationId" value={selected.id} />
            <TextField label="Nome" name="name" required />
            <label className="grid gap-2 text-sm font-medium">
              Descrição
              <textarea
                name="description"
                rows={4}
                className="rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <Button type="submit">Criar projeto</Button>
          </form>
        </Panel>
      </div>
    </ProductPage>
  );
}
