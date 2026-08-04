# Arquitetura da Fase 1

## Decisão

A arquitetura proposta é válida para o MVP, desde que Supabase e Drizzle tenham responsabilidades explícitas:

- **Supabase**: PostgreSQL gerenciado, Auth, Storage e aplicação de RLS para requisições do usuário.
- **Drizzle ORM**: schema tipado, consultas exclusivamente server-side e introspecção.
- **Next.js**: interface, Server Components, Server Actions e Route Handlers.
- **Turborepo**: orquestração do monorepo e cache de tarefas.
- **Shadcn/UI**: código de componentes compartilhado, mantido em `packages/ui`.

Uma conexão `DATABASE_URL` pode usar um papel com privilégios elevados e não deve ser tratada como substituta do RLS. Fluxos do usuário devem usar o cliente Supabase SSR ou aplicar explicitamente o `organization_id` validado no servidor. A chave `service_role` nunca pode chegar ao navegador.

As migrações SQL em `supabase/migrations` são canônicas. O Drizzle descreve o schema público para tipagem e consultas, mas não mantém uma segunda sequência de migrações. Isso evita divergência entre o estado aplicado pelo Supabase CLI e o estado conhecido pelo ORM.

## Estrutura

```text
apps/
  web/                  Next.js 16 e integração Supabase SSR
packages/
  db/                   Drizzle, schema e cliente Postgres server-only
  ui/                   componentes Shadcn/UI compartilhados
  eslint-config/        configuração ESLint compartilhada
  typescript-config/    configuração TypeScript compartilhada
supabase/
  migrations/           SQL, funções auxiliares e políticas RLS
docs/                   fonte de verdade técnica
```

## Modelo multi-tenant inicial

```text
organizations
  ├── organization_members
  └── projects
```

Toda tabela de domínio criada nas próximas fases deve possuir `organization_id`, índice correspondente e políticas RLS. A migração inicial adiciona helpers `security definer` com `search_path` vazio para verificar participação e papel sem provocar recursão nas políticas de `organization_members`.

## Fronteiras de segurança

1. O navegador usa somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. O cliente Supabase server-side preserva e renova a sessão em cookies.
3. `packages/db` importa `server-only` e lê `DATABASE_URL` apenas no servidor.
4. O Supabase CLI aplica as migrações canônicas; tráfego server-side da aplicação usa o pooler em `DATABASE_URL`.
5. Cada nova entidade de negócio deve receber políticas RLS antes de ser acessada pela aplicação.

## Evolução prevista

- Fase 2: autenticação, onboarding de organizações e shell autenticado.
- Fase 3: processos, documentos, Supabase Storage e pipeline assíncrono.
- Fase 4: OCR, extração estruturada, checklist, score e relatórios.
- Fase 5: GIS e análises territoriais.
