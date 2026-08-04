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

- [x] Cadastro, login, confirmação de e-mail e recuperação de acesso.
- [x] Criação da primeira organização.
- [x] Convites por token com hash, expiração e validação de e-mail.
- [x] Papéis `owner`, `admin`, `analyst`, `reviewer` e `viewer`.
- [x] Rotas protegidas e shell do produto.
- [x] Cadastro mínimo de projetos e processos.
- [x] Trilha de auditoria somente leitura.
- [x] Testes unitários de validação.
- [ ] Executar os testes pgTAP de isolamento multi-tenant em Supabase local.
- [ ] Validar confirmação de e-mail e recuperação com SMTP no projeto remoto.

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
