"use client";

import { Button } from "@regularizando/ui/components/button";
import { useActionState } from "react";

import {
  createInvitation,
  type InvitationState,
} from "@/app/(protected)/actions";

const initialState: InvitationState = {};

export function InvitationForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(
    createInvitation,
    initialState,
  );

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <label className="grid gap-2 text-sm font-medium">
        E-mail do convidado
        <input
          required
          type="email"
          name="email"
          className="h-11 rounded-xl border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Perfil
        <select
          name="role"
          defaultValue="analyst"
          className="h-11 rounded-xl border border-border bg-background px-3"
        >
          <option value="admin">Administrador</option>
          <option value="analyst">Analista</option>
          <option value="reviewer">Revisor</option>
          <option value="viewer">Visualizador</option>
        </select>
      </label>
      <Button disabled={pending} type="submit">
        {pending ? "Criando convite..." : "Criar link de convite"}
      </Button>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.inviteUrl ? (
        <div className="rounded-xl bg-muted p-4 text-sm">
          <p className="font-medium">Link criado — copie agora:</p>
          <code className="mt-2 block break-all text-xs">
            {state.inviteUrl}
          </code>
        </div>
      ) : null}
    </form>
  );
}
