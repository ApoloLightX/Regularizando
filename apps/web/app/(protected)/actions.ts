"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  invitationSchema,
  licensingProcessSchema,
  organizationSchema,
  projectSchema,
  slugifyOrganizationName,
} from "@/lib/validation";

function destination(path: string, kind: "error" | "success", message: string) {
  const query = new URLSearchParams({ [kind]: message });
  return `${path}${path.includes("?") ? "&" : "?"}${query.toString()}`;
}

export async function createOrganization(formData: FormData) {
  const user = await requireUser();
  const parsed = organizationSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    redirect(destination("/onboarding", "error", "Informe o nome da empresa."));
  }

  const supabase = await createClient();
  const slugBase = slugifyOrganizationName(parsed.data.name) || "organizacao";
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: parsed.data.name,
      slug: `${slugBase}-${randomUUID().slice(0, 8)}`,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      destination(
        "/onboarding",
        "error",
        "Não foi possível criar a organização.",
      ),
    );
  }

  redirect(
    destination(`/dashboard?org=${data.id}`, "success", "Organização criada."),
  );
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const parsed = projectSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    redirect(destination("/projetos", "error", "Revise os dados do projeto."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    organization_id: parsed.data.organizationId,
    name: parsed.data.name,
    description: parsed.data.description,
    created_by: user.id,
  });

  if (error) {
    redirect(
      destination(
        `/projetos?org=${parsed.data.organizationId}`,
        "error",
        "Você não tem permissão ou o projeto não pôde ser criado.",
      ),
    );
  }

  revalidatePath("/projetos");
  redirect(
    destination(
      `/projetos?org=${parsed.data.organizationId}`,
      "success",
      "Projeto criado.",
    ),
  );
}

export async function createLicensingProcess(formData: FormData) {
  const user = await requireUser();
  const parsed = licensingProcessSchema.safeParse({
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    agency: formData.get("agency") || undefined,
    municipality: formData.get("municipality") || undefined,
    state: formData.get("state"),
    activity: formData.get("activity") || undefined,
  });

  const organizationId = String(formData.get("organizationId") ?? "");
  const errorPath = /^[0-9a-f-]{36}$/i.test(organizationId)
    ? `/processos?org=${organizationId}`
    : "/processos";

  if (!parsed.success) {
    redirect(
      destination(
        errorPath,
        "error",
        parsed.error.issues[0]?.message ?? "Revise os dados do processo.",
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("licensing_processes").insert({
    organization_id: parsed.data.organizationId,
    project_id: parsed.data.projectId,
    name: parsed.data.name,
    agency: parsed.data.agency,
    municipality: parsed.data.municipality,
    state: parsed.data.state,
    activity: parsed.data.activity,
    created_by: user.id,
  });

  if (error) {
    redirect(
      destination(
        `/processos?org=${parsed.data.organizationId}`,
        "error",
        "Você não tem permissão ou o processo não pôde ser criado.",
      ),
    );
  }

  revalidatePath("/processos");
  redirect(
    destination(
      `/processos?org=${parsed.data.organizationId}`,
      "success",
      "Processo criado.",
    ),
  );
}

export type InvitationState = {
  error?: string;
  inviteUrl?: string;
};

export async function createInvitation(
  _state: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const user = await requireUser();
  const parsed = invitationSchema.safeParse({
    organizationId: formData.get("organizationId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: "Revise o e-mail e o perfil de acesso." };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const supabase = await createClient();
  const { error } = await supabase.from("organization_invitations").insert({
    organization_id: parsed.data.organizationId,
    email: parsed.data.email,
    role: parsed.data.role,
    token_hash: `\\x${tokenHash}`,
    invited_by: user.id,
  });

  if (error) {
    return {
      error: "Não foi possível criar o convite ou já existe um pendente.",
    };
  }

  const origin = new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ).origin;
  return { inviteUrl: `${origin}/convite/${token}` };
}

export async function acceptInvitation(formData: FormData) {
  await requireUser();
  const token = String(formData.get("token") ?? "");

  if (token.length < 32 || token.length > 128) {
    redirect(destination("/dashboard", "error", "Convite inválido."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_organization_invitation", {
    invitation_token: token,
  });

  if (error || !data) {
    redirect(
      destination(
        "/dashboard",
        "error",
        "O convite é inválido, expirou ou pertence a outro e-mail.",
      ),
    );
  }

  redirect(`/dashboard?org=${data}&success=Convite aceito`);
}
