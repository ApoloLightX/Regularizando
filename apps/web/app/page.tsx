import { Button } from "@regularizando/ui/components/button";
import { ArrowRight, Database, FileCheck2, ShieldCheck } from "lucide-react";

const foundations = [
  {
    title: "Base multi-tenant",
    description:
      "Organizações, membros e projetos com isolamento preparado por RLS.",
    icon: ShieldCheck,
  },
  {
    title: "Dados tipados",
    description:
      "PostgreSQL no Supabase com schema e consultas tipadas pelo Drizzle.",
    icon: Database,
  },
  {
    title: "Pronto para evoluir",
    description:
      "Fundação modular para documentos, análises, score e relatórios.",
    icon: FileCheck2,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[36rem] bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_55%)]" />
      <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
            Licença Rápida · fundação técnica
          </div>
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
            Regularização ambiental com menos retrabalho.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            Uma infraestrutura digital para organizar documentos, antecipar
            inconsistências e preparar processos ambientais com inteligência.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg">
              Fundação concluída
              <ArrowRight aria-hidden="true" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com/ApoloLightX/Regularizando">
                Ver documentação
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {foundations.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card/85 p-6 shadow-sm backdrop-blur"
            >
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 leading-7 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
