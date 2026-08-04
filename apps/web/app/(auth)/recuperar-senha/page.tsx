import { Button } from "@regularizando/ui/components/button";
import Link from "next/link";

import { requestPasswordReset } from "@/app/auth/actions";
import { AuthCard, Field, FormMessage } from "@/components/auth-card";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const message = await searchParams;

  return (
    <AuthCard
      title="Recupere o acesso"
      description="Enviaremos um link de recuperação caso o e-mail esteja cadastrado."
      footer={
        <Link className="font-medium text-primary" href="/login">
          Voltar para o login
        </Link>
      }
    >
      <FormMessage {...message} />
      <form action={requestPasswordReset} className="grid gap-5">
        <Field label="E-mail" name="email" type="email" autoComplete="email" />
        <Button size="lg" type="submit">
          Enviar instruções
        </Button>
      </form>
    </AuthCard>
  );
}
