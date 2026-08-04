import { Button } from "@regularizando/ui/components/button";
import Link from "next/link";

import { AuthCard, Field, FormMessage } from "@/components/auth-card";
import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const message = await searchParams;

  return (
    <AuthCard
      title="Entre na sua conta"
      description="Acompanhe projetos, processos e pendências ambientais em um só lugar."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link className="font-medium text-primary" href="/cadastro">
            Criar conta
          </Link>
        </>
      }
    >
      <FormMessage {...message} />
      <form action={signIn} className="grid gap-5">
        <Field label="E-mail" name="email" type="email" autoComplete="email" />
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <Link
            className="text-sm text-muted-foreground hover:text-foreground"
            href="/recuperar-senha"
          >
            Esqueci minha senha
          </Link>
        </div>
        <Button size="lg" type="submit">
          Entrar
        </Button>
      </form>
    </AuthCard>
  );
}
