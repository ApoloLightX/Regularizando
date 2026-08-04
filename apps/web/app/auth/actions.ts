"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  emailSchema,
  passwordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";

function messageUrl(path: string, kind: "error" | "success", message: string) {
  const query = new URLSearchParams({ [kind]: message });
  return `${path}?${query.toString()}`;
}

function getOrigin() {
  return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .origin;
}

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(messageUrl("/login", "error", "Revise o e-mail e a senha."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(messageUrl("/login", "error", "E-mail ou senha inválidos."));
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      messageUrl(
        "/cadastro",
        "error",
        parsed.error.issues[0]?.message ?? "Revise os dados informados.",
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getOrigin()}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    redirect(
      messageUrl(
        "/cadastro",
        "error",
        "Não foi possível criar a conta. Tente novamente.",
      ),
    );
  }

  redirect(
    messageUrl(
      "/login",
      "success",
      "Conta criada. Confira seu e-mail para confirmar o acesso.",
    ),
  );
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));

  if (parsed.success) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${getOrigin()}/auth/confirm?next=/atualizar-senha`,
    });
  }

  redirect(
    messageUrl(
      "/recuperar-senha",
      "success",
      "Se o e-mail estiver cadastrado, enviaremos as instruções.",
    ),
  );
}

export async function updatePassword(formData: FormData) {
  const parsed = passwordSchema.safeParse(formData.get("password"));

  if (!parsed.success) {
    redirect(
      messageUrl(
        "/atualizar-senha",
        "error",
        parsed.error.issues[0]?.message ?? "Senha inválida.",
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });

  if (error) {
    redirect(
      messageUrl(
        "/atualizar-senha",
        "error",
        "O link expirou ou não é mais válido.",
      ),
    );
  }

  redirect(messageUrl("/dashboard", "success", "Senha atualizada."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
