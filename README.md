# Regularizando 🌱

## Plataforma Inteligente de Regularização Ambiental baseada em IA

O Regularizando é uma plataforma SaaS B2B criada para transformar processos complexos de regularização ambiental em fluxos inteligentes, organizados e automatizados.

A plataforma combina Inteligência Artificial, processamento documental, dados ambientais e geoprocessamento para auxiliar empresas, consultorias e equipes ambientais na preparação, análise e acompanhamento de processos.

---

# Visão do Produto

O Regularizando não é apenas um gerenciador de documentos.

É uma infraestrutura digital para a nova geração de processos ambientais.

O objetivo é reduzir o tempo gasto em tarefas repetitivas, aumentar a qualidade documental e permitir que processos cheguem mais completos e organizados às etapas oficiais de análise.

---

# Primeiro Produto: Licença Rápida

O Licença Rápida será o primeiro módulo da plataforma Regularizando.

Ele funciona como uma esteira inteligente de pré-análise para licenciamento ambiental.

A plataforma não substitui órgãos ambientais. Ela prepara processos, identifica inconsistências e organiza informações antes do protocolo.

---

# Problema

O licenciamento ambiental possui grandes desafios:

- alto volume documental;
- análises manuais repetitivas;
- falta de padronização;
- dificuldade de identificar erros antecipadamente;
- baixa integração entre documentos e dados territoriais.

Consequências:

- atrasos em projetos;
- aumento de custos;
- retrabalho;
- insegurança operacional.

---

# Objetivo do MVP

Validar a hipótese de que Inteligência Artificial pode reduzir drasticamente o tempo gasto na triagem documental ambiental.

O MVP terá como foco:

- cadastro de projetos;
- upload inteligente;
- OCR;
- extração de informações;
- checklist automático;
- identificação de inconsistências;
- score de preparação documental;
- geração de relatórios.

---

# Arquitetura Tecnológica

## Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- TanStack Table
- Recharts
- React Leaflet

## Backend

- Next.js Server Actions
- API Routes
- Supabase
- PostgreSQL
- Drizzle ORM

## IA

- OpenAI API
- OCR
- Structured Outputs
- Embeddings
- Pipeline inteligente de análise

## GIS

- Leaflet
- MapLibre
- Turf.js
- Dados ambientais e territoriais

---

# Arquitetura SaaS Multi Tenant

Organização

→ Usuários

→ Projetos

→ Processos

→ Documentos

→ Dados Extraídos

→ IA

→ Score

→ Relatório

Cada organização possui isolamento completo de dados utilizando políticas de segurança e RLS.

---

# Roadmap

## MVP V1

Base SaaS, documentos, autenticação e IA inicial.

## MVP V2

Geoprocessamento, análises ambientais avançadas e dashboards.

## MVP V3

Automação completa, integrações externas e recursos Enterprise.

---

# Documentação

A documentação técnica está organizada em `/docs` e serve como fonte única de verdade para desenvolvimento humano e ferramentas de IA:

- [Arquitetura da Fase 1](docs/architecture.md)
- [Plano de implementação](docs/implementation-plan.md)

---

# Desenvolvimento local

## Requisitos

- Node.js 20.9 ou superior;
- pnpm 10 ou superior;
- Docker, caso utilize o Supabase local.

## Início rápido

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

O app web estará disponível em `http://localhost:3000`.

## Validação

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Banco de dados

As migrações que incluem recursos específicos do Supabase ficam em `supabase/migrations`. O schema Drizzle correspondente fica em `packages/db/src/schema`.

```bash
pnpm db:start
pnpm db:reset
pnpm db:lint
```

Em ambientes remotos, use `pnpm db:push` somente depois de conferir o projeto Supabase vinculado. O Supabase CLI é a fonte canônica de migrações; o Drizzle fornece schema tipado e acesso server-side, sem manter uma segunda linha de migrações.

---

Construindo tecnologia para simplificar a regularização ambiental brasileira. 🌎
