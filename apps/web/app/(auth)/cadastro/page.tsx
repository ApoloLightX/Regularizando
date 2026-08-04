import { Button } from "@regularizando/ui/components/button";
import Link from "next/link";

import { signUp } from "@/app/auth/actions";
import { AuthCard, Field, FormMessage } from "@/components/auth-card";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const message = await searchParams;

  return (
    <AuthCard
      title="Crie seu espaço"
      description="Comece organizando sua empresa e o primeiro projeto ambiental."
      footer={
        <>
          Já possui conta?{" "}
          <Link className="font-medium text-primary" href="/login">
            Entrar
          </Link>
        </>
      }
    >
      <FormMessage {...message} />
      <form action={signUp} className="grid gap-5">
        <Field label="Nome completo" name="fullName" autoComplete="name" />
        <Field label="E-mail" name="email" type="email" autoComplete="email" />
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Pelo menos 10 caracteres"
        />
        <Button size="lg" type="submit">
          Criar conta
        </Button>
      </form>
    </AuthCard>
  );
}
