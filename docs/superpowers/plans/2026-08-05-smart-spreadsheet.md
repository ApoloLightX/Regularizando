# Fase 3 — Planilha Inteligente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que usuários autorizados importem XLSX/CSV privados, extraiam coordenadas, monitoramento e checklists com rastreabilidade por célula e revisem cada proposta antes de qualquer uso posterior.

**Architecture:** Um pacote TypeScript puro concentra leitura, classificação e normalização, sem dependência de Next.js, Supabase ou provedor de IA. O aplicativo Next.js coordena upload direto ao Supabase Storage, processamento retomável por aba, resolução opcional de ambiguidades via AI Gateway e revisão por funções atômicas do Postgres. Todas as tabelas e objetos permanecem isolados por organização mediante chaves compostas, RLS e políticas de Storage.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5.9, Supabase Postgres/Auth/Storage, Drizzle ORM, Vitest 3, pgTAP, ExcelJS 4.4, csv-parse 7, file-type 22, iconv-lite 0.7, proj4 2.21, Zod 4.4 e AI SDK 7 via Vercel AI Gateway.

## Global Constraints

- Aceitar somente XLSX e CSV com tamanho máximo de `10 MB`.
- Aceitar no máximo `20` abas por XLSX e `50.000` linhas por aba/tabela.
- Nunca executar fórmulas, macros, links externos, consultas, scripts ou objetos incorporados.
- Preservar valor original, arquivo, aba, linha, coluna e endereço A1 para toda evidência persistida.
- Não inferir silenciosamente zona, hemisfério, datum, ordem de eixos, separador decimal ou obrigação jurídica.
- Toda coordenada, medição e pendência inicia em `proposta` e exige confirmação, edição ou rejeição humana.
- IA é usada no máximo uma vez por ambiguidade relevante; falha ou indisponibilidade mantém o resultado ambíguo para revisão.
- Não publicar mapa, aplicar limite legal, calcular score ou emitir conclusão de conformidade neste recorte.
- Toda tabela exposta usa RLS; toda função privilegiada valida `auth.uid()`, tenant e papel explicitamente.
- O objeto original é imutável, privado e acessível somente por autorização ou URL assinada curta.
- A chave idempotente é `organization_id + licensing_process_id + sha256 + extractor_version`.

---

## File Map

### Novo pacote de domínio

- `packages/spreadsheet/package.json`: dependências e scripts do motor puro.
- `packages/spreadsheet/tsconfig.json`: configuração TypeScript do workspace.
- `packages/spreadsheet/src/contracts.ts`: tipos estáveis compartilhados entre parser, detectores e orquestração.
- `packages/spreadsheet/src/file-validation.ts`: assinatura real, limites e segurança de XLSX/CSV.
- `packages/spreadsheet/src/read-tabular.ts`: leitura sem execução de conteúdo ativo.
- `packages/spreadsheet/src/header-detection.ts`: identificação de tabela, cabeçalho e forma normalizada.
- `packages/spreadsheet/src/classification.ts`: confiança, sinais e política de ambiguidade.
- `packages/spreadsheet/src/coordinates.ts`: latitude/longitude e UTM.
- `packages/spreadsheet/src/monitoring.ts`: vazão, ruído, pH, DBO e normalizações seguras.
- `packages/spreadsheet/src/checklist.ts`: checklist e pendências apenas propostas.
- `packages/spreadsheet/src/extract-sheet.ts`: composição determinística de uma aba.
- `packages/spreadsheet/src/index.ts`: API pública do pacote.
- `packages/spreadsheet/src/*.test.ts`: testes unitários ao lado de cada responsabilidade.
- `packages/spreadsheet/test/fixtures/*`: XLSX/CSV mínimos, inclusive casos adversariais.

### Banco e Storage

- `supabase/migrations/<generated>_phase_3_smart_spreadsheet.sql`: enums, tabelas, chaves, funções, auditoria, RLS, bucket e políticas.
- `supabase/tests/database/phase_3_smart_spreadsheet.test.sql`: pgTAP de tenant, papéis, idempotência, revisão e Storage.
- `packages/db/src/schema/index.ts`: representação Drizzle das tabelas e relações novas.

### Aplicação web

- `apps/web/lib/spreadsheets/contracts.ts`: schemas Zod das fronteiras server/client e banco/motor.
- `apps/web/lib/spreadsheets/ai-resolver.ts`: adapter opcional do AI Gateway.
- `apps/web/lib/spreadsheets/import-service.ts`: preparação, finalização e reaproveitamento idempotente.
- `apps/web/lib/spreadsheets/process-service.ts`: reivindicação e persistência de uma aba por chamada.
- `apps/web/lib/spreadsheets/review-service.ts`: consultas da tela de revisão.
- `apps/web/app/(protected)/processos/[processId]/planilhas/actions.ts`: Server Actions autorizadas.
- `apps/web/app/(protected)/processos/[processId]/planilhas/upload-form.tsx`: upload direto por URL assinada.
- `apps/web/app/(protected)/processos/[processId]/planilhas/page.tsx`: lista de importações do processo.
- `apps/web/app/(protected)/processos/[processId]/planilhas/[importId]/page.tsx`: página de processamento e revisão.
- `apps/web/app/(protected)/processos/[processId]/planilhas/[importId]/processing-controller.tsx`: execução retomável de uma aba por chamada.
- `apps/web/app/(protected)/processos/[processId]/planilhas/[importId]/review-workspace.tsx`: filtros e decisões humanas.
- `apps/web/app/(protected)/processos/page.tsx`: link de cada processo para suas planilhas.
- `apps/web/lib/spreadsheets/*.test.ts`: testes de serviços e fallback de IA.
- `apps/web/app/(protected)/processos/[processId]/planilhas/*.test.tsx`: testes de interação e acessibilidade.
- `.env.example`: `AI_GATEWAY_API_KEY` e `AI_GATEWAY_MODEL`, ambos server-only.

---

### Task 1: Criar o pacote puro e seus contratos

**Files:**

- Create: `packages/spreadsheet/package.json`
- Create: `packages/spreadsheet/tsconfig.json`
- Create: `packages/spreadsheet/src/contracts.ts`
- Create: `packages/spreadsheet/src/index.ts`
- Create: `packages/spreadsheet/src/contracts.test.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces: `SpreadsheetFileKind`, `TabularSheet`, `SourceCell`, `SheetExtraction`, `Candidate`, `AmbiguityResolver` e `EXTRACTOR_VERSION`.
- Consumes: nenhum código da aplicação.

- [ ] **Step 1: Escrever o teste que fixa o contrato e a imutabilidade da origem**

```ts
import { describe, expect, it } from "vitest";

import { EXTRACTOR_VERSION, sourceCellSchema } from "./contracts";

describe("spreadsheet contracts", () => {
  it("requires an address and keeps formula text separate from cached value", () => {
    const cell = sourceCellSchema.parse({
      sheetIndex: 0,
      sheetName: "Pontos",
      row: 8,
      column: 2,
      address: "B8",
      headerOriginal: "Latitude",
      rawValue: -23.55052,
      safeText: "-23.55052",
      formulaText: null,
    });

    expect(cell.address).toBe("B8");
    expect(cell.rawValue).toBe(-23.55052);
    expect(EXTRACTOR_VERSION).toMatch(/^spreadsheet-v\d+$/);
  });
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha inicial**

Run: `pnpm --filter @regularizando/spreadsheet test -- contracts.test.ts`

Expected: FAIL porque o workspace e `contracts.ts` ainda não existem.

- [ ] **Step 3: Criar o workspace e os tipos estáveis**

```ts
export const EXTRACTOR_VERSION = "spreadsheet-v1";

export type CandidateKind = "coordinate" | "monitoring" | "document_pending";
export type ReviewStatus = "proposta" | "confirmada" | "editada" | "rejeitada";
export type SheetClassification =
  "coordenadas" | "monitoramento" | "checklist_documental" | "tabular_generico";

export interface AmbiguityResolver {
  resolve(input: AmbiguityRequest): Promise<AmbiguityResolution | null>;
}

export interface AmbiguityRequest {
  headers: string[];
  sampleRows: string[][];
  deterministicScores: Record<SheetClassification, number>;
  signals: string[];
}

export interface AmbiguityResolution {
  classifications: Array<{ kind: SheetClassification; confidence: number }>;
  rationale: string;
}
```

O `package.json` deve usar versões exatas e scripts locais:

```json
{
  "name": "@regularizando/spreadsheet",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "csv-parse": "7.0.2",
    "exceljs": "4.4.0",
    "file-type": "22.0.1",
    "iconv-lite": "0.7.3",
    "proj4": "2.21.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@regularizando/typescript-config": "workspace:*",
    "@types/node": "24.10.1",
    "typescript": "5.9.3",
    "vitest": "3.2.4"
  }
}
```

- [ ] **Step 4: Instalar, testar e conferir tipos**

Run: `pnpm install && pnpm --filter @regularizando/spreadsheet test && pnpm --filter @regularizando/spreadsheet typecheck`

Expected: teste do contrato PASS e TypeScript sem erros.

- [ ] **Step 5: Commit**

```bash
git add packages/spreadsheet pnpm-lock.yaml
git commit -m "feat: add spreadsheet extraction contracts"
```

---

### Task 2: Criar schema, funções, RLS e bucket privado

**Files:**

- Create: `supabase/migrations/<generated>_phase_3_smart_spreadsheet.sql`
- Create: `supabase/tests/database/phase_3_smart_spreadsheet.test.sql`
- Modify: `packages/db/src/schema/index.ts`

**Interfaces:**

- Produces: tabelas `spreadsheet_imports`, `spreadsheet_sheets`, `source_cells`, `spreadsheet_candidates`, três subtipos, `candidate_evidence`, `spreadsheet_extraction_runs` e `spreadsheet_review_events`.
- Produces: RPCs `finalize_spreadsheet_import(uuid,text,text,jsonb)`, `claim_next_spreadsheet_sheet(uuid)`, `persist_spreadsheet_sheet_extraction(uuid,integer,jsonb)`, `review_spreadsheet_candidate(uuid,text,jsonb,text,timestamptz)` e `cancel_spreadsheet_import(uuid)`.
- Consumes: `organizations`, `organization_members`, `licensing_processes`, `audit_logs` e helpers `private.has_organization_role`.

- [ ] **Step 1: Criar a migração pelo CLI e escrever os testes pgTAP que falham**

Run: `pnpm exec supabase migration new phase_3_smart_spreadsheet`

Adicionar testes que comprovem, no mínimo:

```sql
select throws_ok(
  $$insert into public.spreadsheet_imports
      (organization_id, licensing_process_id, storage_path, original_name,
       declared_mime, size_bytes, extractor_version, created_by)
    values
      ('20000000-0000-0000-0000-000000000001',
       '40000000-0000-0000-0000-000000000002',
       'cross-tenant/file.xlsx', 'file.xlsx',
       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       1024, 'spreadsheet-v1',
       '10000000-0000-0000-0000-000000000001')$$,
  '23503',
  null,
  'an import cannot reference a process from another tenant'
);

select is(
  (select count(*) from public.spreadsheet_imports),
  0::bigint,
  'an outsider cannot read another tenant imports'
);
```

- [ ] **Step 2: Rodar banco local e observar o RED**

Run: `pnpm db:start && pnpm db:reset && pnpm db:test`

Expected: FAIL porque as tabelas, tipos, políticas e funções da Fase 3 não existem.

- [ ] **Step 3: Implementar enums, tabelas e invariantes**

Usar enums com estes valores exatos:

```sql
create type public.spreadsheet_import_status as enum (
  'recebendo', 'aguardando_processamento', 'processando',
  'aguardando_revisao', 'concluida', 'concluida_com_alertas',
  'falhou', 'cancelada'
);

create type public.spreadsheet_candidate_kind as enum (
  'coordinate', 'monitoring', 'document_pending'
);

create type public.spreadsheet_review_status as enum (
  'proposta', 'confirmada', 'editada', 'rejeitada'
);
```

Incluir chaves compostas `(id, organization_id)` em importação, aba e candidato; todas as FKs de domínio devem carregar `organization_id`. O índice idempotente deve ser:

```sql
create unique index spreadsheet_imports_idempotency_unique
  on public.spreadsheet_imports (
    organization_id, licensing_process_id, sha256, extractor_version
  )
  where sha256 is not null and status <> 'cancelada';
```

Persistir apenas células relacionadas a candidatos ou alertas, nunca a planilha inteira. `raw_value` e `confirmed_payload` usam `jsonb`; `safe_text`, `formula_text`, sinais e alertas têm limites de tamanho por `check`.

- [ ] **Step 4: Implementar mutações atômicas, auditoria e bloqueio de acesso direto**

As RPCs privilegiadas devem validar identidade e papel antes de qualquer mutação:

```sql
if (select auth.uid()) is null then
  raise exception 'Authentication required.' using errcode = '42501';
end if;

if not private.has_organization_role(
  target.organization_id,
  array['owner','admin','analyst','reviewer']::public.organization_role[]
) then
  raise exception 'Insufficient role.' using errcode = '42501';
end if;
```

Configurar `security definer set search_path = ''`, revogar `execute` de `public`, `anon` e `authenticated`, conceder apenas a assinatura exata a `authenticated` e não conceder `UPDATE` direto em candidatos ou `INSERT` direto em eventos.

`finalize_spreadsheet_import` recebe o hash calculado no servidor, MIME detectado e metadados de abas; cria as abas e muda para `aguardando_processamento` na mesma transação. Em conflito da chave idempotente, retorna o `id` existente sem alterar seus resultados.

`claim_next_spreadsheet_sheet` usa `for update skip locked`, troca uma aba pendente para `processando` e devolve somente uma aba. `persist_spreadsheet_sheet_extraction` valida versão e aba reivindicada, insere células necessárias, candidatos, subtipos e evidências e atualiza progresso na mesma transação. Payload inválido reverte a aba inteira, não as abas concluídas anteriormente.

`review_spreadsheet_candidate` compara `expected_updated_at`, preserva proposta e payload confirmado separadamente, insere `spreadsheet_review_events` e deriva o estado da importação. `cancel_spreadsheet_import` só opera antes dos estados finais e não remove histórico.

- [ ] **Step 5: Criar bucket privado e políticas por registro de importação**

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spreadsheet-imports',
  'spreadsheet-imports',
  false,
  10485760,
  array[
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

`INSERT` em `storage.objects` exige importação `recebendo`, `created_by = auth.uid()` e papel `owner/admin/analyst`. `SELECT` exige vínculo entre `storage.objects.name` e `spreadsheet_imports.storage_path` mais membership na organização. Não criar política de `UPDATE`; objetos são imutáveis.

- [ ] **Step 6: Espelhar o schema no Drizzle**

Adicionar enums, tabelas, índices e relações com os mesmos nomes SQL. Exportar os tipos `SpreadsheetImport`, `SpreadsheetCandidate` e `SpreadsheetReviewEvent`.

- [ ] **Step 7: Validar banco e regressões**

Run: `pnpm db:reset && pnpm db:lint && pnpm db:test && pnpm --filter @regularizando/db typecheck`

Expected: todos os testes pgTAP, lint do banco e typecheck passam.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations supabase/tests/database/phase_3_smart_spreadsheet.test.sql packages/db/src/schema/index.ts
git commit -m "feat: add spreadsheet persistence and tenant policies"
```

---

### Task 3: Validar e ler XLSX/CSV sem conteúdo ativo

**Files:**

- Create: `packages/spreadsheet/src/file-validation.ts`
- Create: `packages/spreadsheet/src/file-validation.test.ts`
- Create: `packages/spreadsheet/src/read-tabular.ts`
- Create: `packages/spreadsheet/src/read-tabular.test.ts`
- Create: `packages/spreadsheet/test/fixtures/*`
- Modify: `packages/spreadsheet/src/index.ts`

**Interfaces:**

- Produces: `validateSpreadsheetFile(input): Promise<ValidatedSpreadsheetFile>`.
- Produces: `readTabularFile(input): Promise<TabularWorkbook>`.
- Consumes: `SourceCell`, `TabularSheet` e limites globais.

- [ ] **Step 1: Escrever testes de assinatura, limites, fórmulas e CSV ambíguo**

```ts
it("rejects an XLSX extension whose ZIP signature is absent", async () => {
  await expect(
    validateSpreadsheetFile({
      bytes: Buffer.from("not a workbook"),
      filename: "dados.xlsx",
      declaredMime: XLSX_MIME,
    }),
  ).rejects.toMatchObject({ code: "file_signature_mismatch" });
});

it("keeps formula text but never evaluates it", async () => {
  const workbook = await readFixture("formula-without-cache.xlsx");
  const cell = workbook.sheets[0].rows[1][1];
  expect(cell.formulaText).toBe("SUM(A2:A3)");
  expect(cell.rawValue).toBeNull();
});
```

- [ ] **Step 2: Rodar testes e confirmar falhas**

Run: `pnpm --filter @regularizando/spreadsheet test -- file-validation.test.ts read-tabular.test.ts`

Expected: FAIL porque validação, parser e fixtures ainda não existem.

- [ ] **Step 3: Implementar validação real e leitura segura**

`validateSpreadsheetFile` deve:

- rejeitar `bytes.length > 10 * 1024 * 1024`;
- usar `fileTypeFromBuffer` para confirmar XLSX como ZIP/OpenXML;
- rejeitar ZIP que contenha `xl/vbaProject.bin`, objetos ou pacotes externos proibidos;
- tratar CSV como texto e detectar BOM/codificação;
- devolver `delimiter_ambiguous` quando vírgula e ponto e vírgula tiverem pontuações próximas sem escolha segura;
- sanitizar nome usando apenas basename e remover caracteres de controle.

`readTabularFile` deve produzir no máximo 20 abas e 50.000 linhas por aba, preservar endereços A1 e representar fórmulas assim:

```ts
{
  rawValue: cachedResult ?? null,
  safeText: cachedResult == null ? "" : String(cachedResult),
  formulaText: formula == null ? null : String(formula),
}
```

- [ ] **Step 4: Rodar testes do pacote**

Run: `pnpm --filter @regularizando/spreadsheet test && pnpm --filter @regularizando/spreadsheet typecheck`

Expected: fixtures válidas passam; assinatura divergente, proteção, limite, macro e ambiguidade falham com códigos estáveis.

- [ ] **Step 5: Commit**

```bash
git add packages/spreadsheet
git commit -m "feat: safely read xlsx and csv files"
```

---

### Task 4: Detectar cabeçalhos, classificações e confiança

**Files:**

- Create: `packages/spreadsheet/src/header-detection.ts`
- Create: `packages/spreadsheet/src/header-detection.test.ts`
- Create: `packages/spreadsheet/src/classification.ts`
- Create: `packages/spreadsheet/src/classification.test.ts`
- Modify: `packages/spreadsheet/src/index.ts`

**Interfaces:**

- Produces: `detectTables(sheet): DetectedTable[]`.
- Produces: `classifyTable(table): DeterministicClassification`.
- Produces: `needsAmbiguityResolution(result): boolean`.
- Consumes: `TabularSheet`.

- [ ] **Step 1: Escrever testes dos limiares aprovados**

```ts
it("accepts a clear deterministic winner without AI", () => {
  const result = classification({
    coordenadas: 0.94,
    monitoramento: 0.61,
    checklist_documental: 0.12,
    tabular_generico: 0.08,
  });

  expect(result.needsAI).toBe(false);
  expect(result.classifications[0]).toMatchObject({
    kind: "coordenadas",
    confidence: 0.94,
  });
});

it("keeps close classifications ambiguous", () => {
  expect(
    classification({
      coordenadas: 0.86,
      monitoramento: 0.79,
      checklist_documental: 0.1,
      tabular_generico: 0.1,
    }).needsAI,
  ).toBe(true);
});
```

- [ ] **Step 2: Rodar os testes e observar o RED**

Run: `pnpm --filter @regularizando/spreadsheet test -- header-detection.test.ts classification.test.ts`

Expected: FAIL por módulos ausentes.

- [ ] **Step 3: Implementar cabeçalho e política de confiança**

Normalizar somente para comparação:

```ts
export function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
```

Aceitar resultado determinístico quando `best >= 0.90` e `best - second >= 0.15`. Após IA, manter ambíguo quando `best < 0.80` ou `best - second < 0.10`. Guardar pontuação por categoria, sinais e classificações concorrentes; não descartar classificações múltiplas.

- [ ] **Step 4: Testar todo o pacote**

Run: `pnpm --filter @regularizando/spreadsheet test && pnpm --filter @regularizando/spreadsheet typecheck`

Expected: PASS, inclusive planilha genérica e duas tabelas somente quando a separação for inequívoca.

- [ ] **Step 5: Commit**

```bash
git add packages/spreadsheet/src
git commit -m "feat: classify spreadsheet tables with confidence"
```

---

### Task 5: Extrair coordenadas, monitoramento e checklist

**Files:**

- Create: `packages/spreadsheet/src/coordinates.ts`
- Create: `packages/spreadsheet/src/coordinates.test.ts`
- Create: `packages/spreadsheet/src/monitoring.ts`
- Create: `packages/spreadsheet/src/monitoring.test.ts`
- Create: `packages/spreadsheet/src/checklist.ts`
- Create: `packages/spreadsheet/src/checklist.test.ts`
- Create: `packages/spreadsheet/src/extract-sheet.ts`
- Create: `packages/spreadsheet/src/extract-sheet.test.ts`
- Modify: `packages/spreadsheet/src/index.ts`

**Interfaces:**

- Produces: `extractCoordinates(table): CoordinateCandidate[]`.
- Produces: `extractMonitoring(table): MonitoringCandidate[]`.
- Produces: `extractDocumentPendingItems(table): DocumentPendingCandidate[]`.
- Produces: `extractSheet(sheet, resolver?): Promise<SheetExtraction>`.
- Consumes: tabela detectada, classificação e `AmbiguityResolver`.

- [ ] **Step 1: Escrever testes de domínio representativos**

```ts
it("does not transform incomplete UTM coordinates", () => {
  const candidate = extractCoordinates(
    table([
      ["Este", "Norte"],
      [312345.2, 7421123.8],
    ]),
  )[0];

  expect(candidate.original).toEqual({
    easting: 312345.2,
    northing: 7421123.8,
  });
  expect(candidate.transformed).toBeNull();
  expect(candidate.alerts).toContain("utm_zone_missing");
  expect(candidate.reviewStatus).toBe("proposta");
});

it("proposes but never confirms an overdue document", () => {
  const candidate = extractDocumentPendingItems(
    table([
      ["Documento", "Obrigatório", "Status", "Validade"],
      ["ART", "Sim", "Vencido", "2025-03-01"],
    ]),
  )[0];

  expect(candidate.reason).toBe("document_expired");
  expect(candidate.reviewStatus).toBe("proposta");
  expect(candidate.evidence.map((cell) => cell.address)).toEqual([
    "A2",
    "B2",
    "C2",
    "D2",
  ]);
});
```

- [ ] **Step 2: Rodar testes e confirmar falhas**

Run: `pnpm --filter @regularizando/spreadsheet test -- coordinates.test.ts monitoring.test.ts checklist.test.ts extract-sheet.test.ts`

Expected: FAIL por detectores ausentes.

- [ ] **Step 3: Implementar coordenadas sem inferência silenciosa**

- Latitude deve ficar entre `-90` e `90`; longitude entre `-180` e `180`.
- Detectar possível troca de eixos, mas apenas adicionar `axis_order_suspected`.
- UTM requer easting, northing, zona e hemisfério para transformar.
- Datum ausente mantém `transformed: null` e alerta `datum_missing`; não escolher datum por município.
- Quando todos os campos forem explícitos, usar `proj4` e registrar CRS de origem, CRS de destino e método.

- [ ] **Step 4: Implementar monitoramento com normalização segura**

Usar dicionário versionado para `vazao`, `ruido`, `ph` e `dbo`. Guardar `parameterOriginal`, `parameterNormalized`, `valueOriginal`, `unitOriginal`, `valueNormalized`, `unitNormalized` e `readyForComparison`. Conversões permitidas no primeiro extrator:

```ts
const SAFE_CONVERSIONS = {
  "L/s->m3/s": (value: number) => value / 1000,
  "m3/h->m3/s": (value: number) => value / 3600,
  "ug/L->mg/L": (value: number) => value / 1000,
} as const;
```

pH não recebe conversão; ruído exige unidade explícita; DBO sem matriz/fração fica `readyForComparison: false`.

- [ ] **Step 5: Implementar checklist sem criar obrigação jurídica**

Somente propor pendência quando a própria linha informar obrigatoriedade e status ausente, ilegível, vencido ou inconsistente. Nome de documento isolado nunca basta para `required: true`.

- [ ] **Step 6: Compor extração de uma aba e fallback humano**

`extractSheet` executa regras primeiro, chama o resolver uma única vez apenas quando `needsAI` for verdadeiro e houver amostra permitida, valida a resposta e mantém `ambiguities` quando os limiares pós-IA não forem atingidos.

- [ ] **Step 7: Rodar pacote completo**

Run: `pnpm --filter @regularizando/spreadsheet test && pnpm --filter @regularizando/spreadsheet typecheck`

Expected: todas as fixtures passam; valores originais permanecem idênticos aos dados de entrada.

- [ ] **Step 8: Commit**

```bash
git add packages/spreadsheet
git commit -m "feat: extract spreadsheet domain candidates"
```

---

### Task 6: Adicionar adapter de IA minimizado e persistência de uma aba

**Files:**

- Create: `apps/web/lib/spreadsheets/contracts.ts`
- Create: `apps/web/lib/spreadsheets/ai-resolver.ts`
- Create: `apps/web/lib/spreadsheets/ai-resolver.test.ts`
- Create: `apps/web/lib/spreadsheets/process-service.ts`
- Create: `apps/web/lib/spreadsheets/process-service.test.ts`
- Modify: `apps/web/package.json`
- Modify: `.env.example`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces: `createAmbiguityResolver(): AmbiguityResolver | undefined`.
- Produces: `processNextSpreadsheetSheet(importId): Promise<ProcessBatchResult>`.
- Consumes: `extractSheet`, Supabase Storage e tabelas da Task 2.

- [ ] **Step 1: Escrever testes do fallback e da minimização**

```ts
it("returns unresolved when the gateway is not configured", async () => {
  expect(createAmbiguityResolver({})).toBeUndefined();
});

it("sends at most eight minimized sample rows", async () => {
  const generate = vi.fn().mockResolvedValue({
    output: {
      classifications: [{ kind: "monitoramento", confidence: 0.84 }],
      rationale: "Cabeçalhos de parâmetro, valor e unidade.",
    },
  });
  const resolver = createAmbiguityResolver(
    { AI_GATEWAY_MODEL: "provider/model" },
    generate,
  );

  await resolver?.resolve(ambiguityWithTwentyRows());
  expect(generate).toHaveBeenCalledWith(
    expect.objectContaining({ prompt: expect.not.stringContaining("linha-9") }),
  );
});
```

- [ ] **Step 2: Instalar dependências do aplicativo e confirmar o RED**

Run: `pnpm --filter @regularizando/web add 'ai@7.0.52' '@regularizando/spreadsheet@workspace:*' && pnpm --filter @regularizando/web test -- ai-resolver.test.ts process-service.test.ts`

Expected: FAIL porque os adapters ainda não existem.

- [ ] **Step 3: Implementar schema estruturado e uma única chamada**

```ts
const ambiguityOutputSchema = z.object({
  classifications: z.array(
    z.object({
      kind: z.enum([
        "coordenadas",
        "monitoramento",
        "checklist_documental",
        "tabular_generico",
      ]),
      confidence: z.number().min(0).max(1),
    }),
  ),
  rationale: z.string().max(500),
});

const result = await generateText({
  model: env.AI_GATEWAY_MODEL,
  output: Output.object({ schema: ambiguityOutputSchema }),
  prompt: buildMinimizedPrompt(input),
  maxRetries: 0,
  timeout: { totalMs: 15_000 },
});
```

Não registrar prompt ou resposta bruta em `audit_logs`. Retornar `null` em timeout, falha de schema ou ausência de modelo. Registrar somente modelo, versão do schema, latência, uso agregado e correlation id na execução.

- [ ] **Step 4: Implementar processamento retomável de uma aba**

`processNextSpreadsheetSheet` deve:

1. carregar importação pela sessão do usuário e RLS;
2. rejeitar papel `viewer` e `reviewer` para processamento;
3. reivindicar uma aba ainda não concluída por `claim_next_spreadsheet_sheet`;
4. baixar o objeto privado sem URL pública;
5. validar novamente hash e versão;
6. extrair apenas a aba reivindicada;
7. persistir células usadas, candidatos e evidências por `persist_spreadsheet_sheet_extraction`;
8. concluir a execução como parcial, revisão ou falha total;
9. sanitizar mensagens antes de persistir.

O retorno deve ser serializável:

```ts
export type ProcessBatchResult =
  | {
      kind: "processed";
      importId: string;
      sheetIndex: number;
      remaining: number;
    }
  | { kind: "review"; importId: string }
  | { kind: "terminal"; importId: string; status: "falhou" | "cancelada" };
```

- [ ] **Step 5: Atualizar variáveis documentadas**

```dotenv
# Server-only AI Gateway configuration. When absent, ambiguous data goes to human review.
AI_GATEWAY_API_KEY=your-ai-gateway-key
AI_GATEWAY_MODEL=provider/model
```

- [ ] **Step 6: Testar adapter, serviço e tipos**

Run: `pnpm --filter @regularizando/web test -- ai-resolver.test.ts process-service.test.ts && pnpm --filter @regularizando/web typecheck`

Expected: fallback sem gateway, timeout, saída inválida, uma chamada máxima e persistência por aba passam.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/spreadsheets apps/web/package.json .env.example pnpm-lock.yaml
git commit -m "feat: orchestrate resumable spreadsheet extraction"
```

---

### Task 7: Implementar upload privado e idempotente por processo

**Files:**

- Create: `apps/web/lib/spreadsheets/import-service.ts`
- Create: `apps/web/lib/spreadsheets/import-service.test.ts`
- Create: `apps/web/app/(protected)/processos/[processId]/planilhas/actions.ts`
- Create: `apps/web/app/(protected)/processos/[processId]/planilhas/upload-form.tsx`
- Create: `apps/web/app/(protected)/processos/[processId]/planilhas/upload-form.test.tsx`
- Create: `apps/web/app/(protected)/processos/[processId]/planilhas/page.tsx`
- Modify: `apps/web/app/(protected)/processos/page.tsx`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces: `prepareSpreadsheetUpload(input): Promise<PreparedUpload>`.
- Produces: `finalizeSpreadsheetUpload(importId, clientSha256): Promise<FinalizeResult>`.
- Consumes: Supabase `createSignedUploadUrl`, `uploadToSignedUrl`, Storage RLS e `EXTRACTOR_VERSION`.

- [ ] **Step 1: Adicionar ambiente de testes React e escrever o fluxo falho**

Adicionar `@testing-library/react@16.3.2`, `@testing-library/user-event@14.6.3` e `jsdom@30.0.1` como dev dependencies. O teste deve comprovar extensão, limite e mensagens acessíveis:

```tsx
it("blocks a file above 10 MB before requesting a signed upload", async () => {
  const user = userEvent.setup();
  render(<UploadForm organizationId={ORG_ID} processId={PROCESS_ID} />);
  const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "dados.xlsx", {
    type: XLSX_MIME,
  });

  await user.upload(screen.getByLabelText("Planilha XLSX ou CSV"), file);
  await user.click(screen.getByRole("button", { name: "Importar planilha" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "O arquivo excede o limite de 10 MB.",
  );
  expect(prepareSpreadsheetUpload).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Rodar os testes e confirmar o RED**

Run: `pnpm --filter @regularizando/web test -- import-service.test.ts upload-form.test.tsx`

Expected: FAIL por serviços e componentes ausentes.

- [ ] **Step 3: Implementar preparação server-side**

Validar organização, processo, papel, basename, extensão, MIME declarado e tamanho. Criar registro `recebendo` com path imutável:

```ts
const storagePath = [
  organizationId,
  processId,
  importId,
  sanitizeFilename(filename),
].join("/");
```

Gerar token por `supabase.storage.from("spreadsheet-imports").createSignedUploadUrl(storagePath)` e retornar `{ importId, storagePath, token }`.

- [ ] **Step 4: Implementar upload direto e finalização confiável**

O Client Component deve calcular SHA-256 com `crypto.subtle.digest`, fazer `uploadToSignedUrl(storagePath, token, file)` sem `upsert` e chamar a finalização. O servidor baixa o objeto autorizado, recalcula SHA-256, valida tipo real e estrutura e compara o hash do cliente apenas como diagnóstico. Depois chama `finalize_spreadsheet_import` com o hash confiável, MIME detectado e metadados das abas.

Se a chave idempotente já existir, cancelar a importação recém-criada, remover seu objeto e redirecionar para a importação existente. Se a remoção falhar, registrar código sanitizado para limpeza; nunca reutilizar path nem sobrescrever objeto.

- [ ] **Step 5: Criar lista de planilhas e link no processo**

A página lê diretamente em Server Component, com `params` e `searchParams` como Promises. Exibir nome, estado, data, abas, alertas e link de revisão. Em `processos/page.tsx`, tornar cada processo acessível por:

```tsx
<Link href={`/processos/${process.id}/planilhas?org=${selected.id}`}>
  Abrir planilhas
</Link>
```

- [ ] **Step 6: Rodar testes, lint e typecheck**

Run: `pnpm --filter @regularizando/web test -- import-service.test.ts upload-form.test.tsx && pnpm --filter @regularizando/web lint && pnpm --filter @regularizando/web typecheck`

Expected: upload válido, limite, erro de Storage, hash divergente, duplicata e acesso negado passam.

- [ ] **Step 7: Commit**

```bash
git add apps/web packages pnpm-lock.yaml
git commit -m "feat: add private spreadsheet upload flow"
```

---

### Task 8: Construir processamento visível e revisão auditável

**Files:**

- Create: `apps/web/lib/spreadsheets/review-service.ts`
- Create: `apps/web/lib/spreadsheets/review-service.test.ts`
- Create: `apps/web/app/(protected)/processos/[processId]/planilhas/[importId]/page.tsx`
- Create: `apps/web/app/(protected)/processos/[processId]/planilhas/[importId]/processing-controller.tsx`
- Create: `apps/web/app/(protected)/processos/[processId]/planilhas/[importId]/processing-controller.test.tsx`
- Create: `apps/web/app/(protected)/processos/[processId]/planilhas/[importId]/review-workspace.tsx`
- Create: `apps/web/app/(protected)/processos/[processId]/planilhas/[importId]/review-workspace.test.tsx`
- Modify: `apps/web/app/(protected)/processos/[processId]/planilhas/actions.ts`

**Interfaces:**

- Produces: `getSpreadsheetReview(importId): Promise<SpreadsheetReviewView>`.
- Produces: Server Action `reviewSpreadsheetCandidate(input): Promise<ActionResult>`.
- Consumes: `processNextSpreadsheetSheet` e RPC `review_spreadsheet_candidate`.

- [ ] **Step 1: Escrever testes de retomada e decisão humana**

```tsx
it("continues one sheet at a time until review is ready", async () => {
  processNextSpreadsheetSheet
    .mockResolvedValueOnce({
      kind: "processed",
      importId: IMPORT_ID,
      sheetIndex: 0,
      remaining: 1,
    })
    .mockResolvedValueOnce({ kind: "review", importId: IMPORT_ID });

  render(<ProcessingController importId={IMPORT_ID} canProcess />);
  await userEvent.click(
    screen.getByRole("button", { name: "Continuar processamento" }),
  );

  expect(processNextSpreadsheetSheet).toHaveBeenCalledTimes(2);
});

it("requires an explicit payload when editing a proposal", async () => {
  render(<ReviewWorkspace data={coordinateProposal()} canReview />);
  await userEvent.click(
    screen.getByRole("button", { name: "Salvar correção" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Revise os valores corrigidos.",
  );
});
```

- [ ] **Step 2: Rodar testes e observar o RED**

Run: `pnpm --filter @regularizando/web test -- review-service.test.ts processing-controller.test.tsx review-workspace.test.tsx`

Expected: FAIL por página, serviço e componentes ausentes.

- [ ] **Step 3: Implementar página Server Component e controle de processamento**

Carregar resumo, abas e candidatos em paralelo. `ProcessingController` faz apenas uma requisição ativa, continua enquanto `remaining > 0`, permite retomada após reload e para em `review`, `falhou`, `cancelada` ou erro. Não manter estado de progresso apenas no navegador.

- [ ] **Step 4: Implementar quatro áreas e filtros**

Exibir:

1. resumo com arquivo, processo, versão, progresso, abas e alertas;
2. coordenadas com original/transformado, CRS, confiança, alertas e células;
3. monitoramento com original/normalizado e `pronto_para_comparacao`;
4. pendências propostas com motivo, evidência e ações.

Filtros: `ambiguous`, `lowConfidence`, `unreviewed` e `sheetId`. Usar os rótulos `Proposta`, `Confirmada`, `Editada` e `Rejeitada`; não usar “aprovado automaticamente” nem “conforme a lei”.

- [ ] **Step 5: Implementar confirmação, edição e rejeição concorrente-segura**

Enviar `candidateId`, `decision`, `confirmedPayload`, `justification` e `expectedUpdatedAt`. Mapear conflito otimista para a mensagem “Este item foi alterado por outra pessoa. Recarregue a revisão.”. Após sucesso, revalidar a página da importação.

- [ ] **Step 6: Derivar estado final**

Quando não houver candidato `proposta`, marcar `concluida_com_alertas` se restar alerta não bloqueante; caso contrário, `concluida`. Falha em uma aba com outra aba válida conduz a `aguardando_revisao`, nunca a `falhou`.

- [ ] **Step 7: Testar interface, lint e tipos**

Run: `pnpm --filter @regularizando/web test -- review-service.test.ts processing-controller.test.tsx review-workspace.test.tsx && pnpm --filter @regularizando/web lint && pnpm --filter @regularizando/web typecheck`

Expected: retomada, estados vazios, erro, filtros, teclado, confirmação, edição, rejeição e conflito passam.

- [ ] **Step 8: Commit**

```bash
git add apps/web
git commit -m "feat: add auditable spreadsheet review workspace"
```

---

### Task 9: Validar a fatia vertical e documentar operação

**Files:**

- Modify: `docs/implementation-plan.md`
- Create: `docs/phase-3-smart-spreadsheet.md`
- Modify: `README.md`
- Modify: testes e fixtures das Tasks 2–8 somente se a validação revelar uma falha real.

**Interfaces:**

- Produces: instruções reproduzíveis de configuração, teste e operação.
- Consumes: toda a fatia vertical.

- [ ] **Step 1: Criar matriz de aceite no documento operacional**

Registrar os 12 critérios da especificação, cada um com comando/teste correspondente. Incluir configuração do bucket, variáveis do AI Gateway, comportamento sem IA, retenção de dados ainda aplicável e como retomar uma importação interrompida.

- [ ] **Step 2: Executar validação completa de aplicação**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
```

Expected: todos os comandos encerram com código 0, sem warnings do lint nem falhas de teste.

- [ ] **Step 3: Executar validação completa do Supabase local**

Run:

```bash
pnpm db:reset
pnpm db:lint
pnpm db:test
pnpm exec supabase migration list --local
```

Expected: migrations aplicadas na ordem, banco sem lint acionável e pgTAP sem falhas.

- [ ] **Step 4: Executar três jornadas manuais com fixtures reais**

1. Owner importa XLSX com coordenadas, monitoramento e checklist, processa e revisa todos os itens.
2. Analyst importa CSV duplicado, recebe a importação existente e não duplica candidatos.
3. Reviewer consulta e revisa, mas não importa, reprocessa nem cancela; viewer apenas consulta.

Confirmar em cada jornada que outra organização não lê banco nem objeto, que fórmulas não são executadas e que nenhuma tela mostra mapa, limite legal ou conclusão de conformidade.

- [ ] **Step 5: Inspecionar auditoria e minimização**

Verificar que eventos contêm ator, decisão, antes/depois, versão e timestamp, mas não planilha completa, prompt bruto, resposta bruta ou segredo. Verificar que a IA recebe no máximo cabeçalhos, sinais e oito linhas minimizadas.

- [ ] **Step 6: Atualizar documentação de fase**

Marcar a Planilha Inteligente como entregue somente após todos os comandos e jornadas anteriores passarem. Documentar limites conhecidos: processamento depende de chamadas retomáveis da interface; mapa, normas, score, OCR e demais formatos continuam fora do recorte.

- [ ] **Step 7: Commit**

```bash
git add README.md docs packages apps supabase pnpm-lock.yaml
git commit -m "docs: verify smart spreadsheet vertical slice"
```

---

## Final Verification Gate

Antes de abrir PR ou declarar a fase concluída:

1. confirmar `git status --short` vazio;
2. repetir `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`;
3. repetir `pnpm db:reset && pnpm db:lint && pnpm db:test` com Docker disponível;
4. revisar o diff por vazamento de chaves, `service_role`, URLs públicas ou conteúdo de planilha em logs;
5. conferir os 12 critérios de aceite da especificação linha a linha;
6. anexar ao PR os comandos executados, resultados e limitações conhecidas.
