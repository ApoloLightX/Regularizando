import { Button } from "@regularizando/ui/components/button";
import { redirect } from "next/navigation";

import { createOrganization } from "@/app/(protected)/actions";
import { ProductPage, Panel, TextField } from "@/components/product-page";
import { listOrganizations } from "@/lib/organizations";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [organizations, message] = await Promise.all([
    listOrganizations(),
    searchParams,
  ]);

  if (organizations.length > 0) {
    redirect("/dashboard");
  }

  return (
    <ProductPage
      title="Crie sua organização"
      description="A organização é o espaço isolado da sua empresa. Projetos, processos e equipe ficarão protegidos por RLS."
      error={message.error}
    >
      <div className="max-w-xl">
        <Panel title="Dados da empresa">
          <form action={createOrganization} className="grid gap-5">
            <TextField
              label="Nome da organização"
              name="name"
              required
              placeholder="Ex.: Consultoria Ambiental Apolo"
            />
            <Button size="lg" type="submit">
              Criar organização
            </Button>
          </form>
        </Panel>
      </div>
    </ProductPage>
  );
}
