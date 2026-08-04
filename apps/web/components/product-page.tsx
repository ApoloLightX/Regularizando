import { FormMessage } from "@/components/auth-card";

export function ProductPage({
  title,
  description,
  error,
  success,
  actions,
  children,
}: {
  title: string;
  description: string;
  error?: string;
  success?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-primary">Licença Rápida</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        </div>
        {actions}
      </header>
      <div className="mt-8">
        <FormMessage error={error} success={success} />
        {children}
      </div>
    </main>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function TextField({
  label,
  name,
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
