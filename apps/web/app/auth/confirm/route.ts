import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/dashboard";
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const supabase = await createClient();
  let error: Error | null = null;

  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    error = new Error("Missing authentication token.");
  }

  if (error) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "O link é inválido ou expirou.");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
