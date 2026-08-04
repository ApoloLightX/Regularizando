# Plano de implementação

## Fase 1 — Fundação técnica

- [x] Workspace pnpm e Turborepo.
- [x] Aplicação Next.js 16 com App Router, React e TypeScript.
- [x] Tailwind CSS v4 e pacote compartilhado Shadcn/UI.
- [x] Clientes Supabase SSR para browser, servidor e `proxy.ts`.
- [x] Pacote Drizzle server-only e configuração do Drizzle Kit.
- [x] Schema multi-tenant inicial: organizações, membros e projetos.
- [x] Migração Supabase com chaves, índices, triggers e RLS.
- [x] Documentação de arquitetura e variáveis de ambiente.
- [ ] Conectar um projeto Supabase real e aplicar a migração.

## Fase 2 — Identidade e onboarding

- Login e recuperação de acesso.
- Criação da primeira organização.
- Convites e papéis de membros.
- Rotas protegidas e shell do produto.
- Testes de isolamento multi-tenant.

## Fase 3 — Licença Rápida

- Cadastro de processos e requisitos.
- Upload seguro no Supabase Storage.
- Estados de processamento e trilha de auditoria.
- Filas e workers idempotentes para documentos.

## Fase 4 — Inteligência documental

- OCR com seleção de provedor por adapter.
- Extração com Structured Outputs e versionamento de schema.
- Checklist, inconsistências e score explicável.
- Relatório versionado com evidências.
