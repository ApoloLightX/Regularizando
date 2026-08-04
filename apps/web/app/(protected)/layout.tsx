import { Button } from "@regularizando/ui/components/button";
import {
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  ScrollText,
  Users,
} from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";

const navigation = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/projetos", label: "Projetos", icon: FolderKanban },
  { href: "/processos", label: "Processos", icon: FileCheck2 },
  { href: "/equipe", label: "Equipe", icon: Users },
  { href: "/auditoria", label: "Auditoria", icon: ScrollText },
];

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-muted/35 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-border bg-card p-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between lg:block">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-primary"
          >
            Regularizando
          </Link>
          <span className="text-xs text-muted-foreground lg:mt-1 lg:block">
            Licença Rápida
          </span>
        </div>
        <nav className="mt-6 flex gap-2 overflow-x-auto lg:grid">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-border pt-5 lg:absolute lg:inset-x-5 lg:bottom-5">
          <p className="mb-3 truncate text-xs text-muted-foreground">
            {user.email}
          </p>
          <form action={signOut}>
            <Button variant="outline" className="w-full" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
