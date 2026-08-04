import { Button } from "@regularizando/ui/components/button";

import { acceptInvitation } from "@/app/(protected)/actions";
import { Panel, ProductPage } from "@/components/product-page";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <ProductPage
      title="Convite para organização"
      description="O acesso só será liberado se este convite estiver válido e pertencer ao e-mail da sua conta."
    >
      <div className="max-w-xl">
        <Panel title="Aceitar convite">
          <form action={acceptInvitation}>
            <input type="hidden" name="token" value={token} />
            <Button size="lg" type="submit">
              Entrar na organização
            </Button>
          </form>
        </Panel>
      </div>
    </ProductPage>
  );
}
