import { redirect } from "next/navigation";

import { InvitationForm } from "@/components/invitation-form";
import { Panel, ProductPage } from "@/components/product-page";
import { requireUser } from "@/lib/auth";
import { resolveOrganization } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  analyst: "Analista",
  reviewer: "Revisor",
  viewer: "Visualizador",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const query = await searchParams;
  const { selected } = await resolveOrganization(query.org);
  if (!selected) redirect("/onboarding");

  const user = await requireUser();
  const supabase = await createClient();
  const [membersResult, invitationsResult, currentMembership] =
    await Promise.all([
      supabase
        .from("organization_members")
        .select("user_id,role,created_at,profiles(full_name)")
        .eq("organization_id", selected.id),
      supabase
        .from("organization_invitations")
        .select("id,email,role,status,expires_at")
        .eq("organization_id", selected.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", selected.id)
        .eq("user_id", user.id)
        .single(),
    ]);
  const canInvite = ["owner", "admin"].includes(
    currentMembership.data?.role ?? "",
  );

  return (
    <ProductPage
      title="Equipe e acesso"
      description="Gerencie perfis por organização sem compartilhar dados entre empresas."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="grid gap-6">
          <Panel title="Membros">
            <div className="grid gap-3">
              {(membersResult.data ?? []).map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {member.profiles?.[0]?.full_name ?? "Membro"}
                    </p>
                    <code className="text-xs text-muted-foreground">
                      {member.user_id}
                    </code>
                  </div>
                  <span className="text-sm font-medium">
                    {roleLabels[member.role] ?? member.role}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Convites pendentes">
            {(invitationsResult.data ?? []).length ? (
              <div className="grid gap-3">
                {(invitationsResult.data ?? []).map((invitation) => (
                  <div
                    key={invitation.id}
                    className="rounded-xl border border-border p-4"
                  >
                    <p className="font-medium">{invitation.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {roleLabels[invitation.role]} · {invitation.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum convite criado.
              </p>
            )}
          </Panel>
        </div>
        {canInvite ? (
          <Panel
            title="Convidar pessoa"
            description="O link só é exibido uma vez. O e-mail da conta deve ser o mesmo do convite."
          >
            <InvitationForm organizationId={selected.id} />
          </Panel>
        ) : (
          <Panel title="Acesso de leitura">
            <p className="text-sm text-muted-foreground">
              Apenas proprietários e administradores podem criar convites.
            </p>
          </Panel>
        )}
      </div>
    </ProductPage>
  );
}
