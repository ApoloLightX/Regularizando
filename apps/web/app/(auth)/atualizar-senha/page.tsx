import { Button } from "@regularizando/ui/components/button";

import { updatePassword } from "@/app/auth/actions";
import { AuthCard, Field, FormMessage } from "@/components/auth-card";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const message = await searchParams;

  return (
    <AuthCard
      title="Defina uma nova senha"
      description="Use uma senha longa e exclusiva para proteger sua conta."
    >
      <FormMessage {...message} />
      <form action={updatePassword} className="grid gap-5">
        <Field
          label="Nova senha"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Pelo menos 10 caracteres"
        />
        <Button size="lg" type="submit">
          Atualizar senha
        </Button>
      </form>
    </AuthCard>
  );
}
