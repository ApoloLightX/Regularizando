# PROJECT_STATUS — Regularizando

> **Auditoria consolidada em:** 21 de agosto de 2026  
> **Branch analisada:** `main`  
> **Snapshot de referência:** `c1f9af533b3054dbcefd0c3aed276e217afbdf81`  
> **Escopo:** árvore completa do repositório, arquitetura, código de produto, configuração, schema/migrações, testes, scripts, documentação, design system e resíduos de scaffold.  
> **Regra desta auditoria:** nenhum código existente foi alterado. Este arquivo é a única adição ao repositório.

## 1. Resumo executivo

O Regularizando não está mais no estágio de protótipo simples. O repositório contém uma **Release Candidate pré-piloto tecnicamente substancial**, com frontend público e autenticado, backend tRPC, banco multi-tenant, motor de obrigações ambientais, cadeia de evidências, RBAC, trilha de auditoria, governança LGPD, validação pública com fontes oficiais e mecanismos de hardening relevantes.

Ao mesmo tempo, o projeto **ainda não deve ser classificado como pronto para produção enterprise nem como piloto com dados reais sem condicionantes adicionais**. Os principais motivos são dependências operacionais externas, acoplamento à plataforma Manus, ausência de antimalware/sandbox, falta de evidência de restore, ausência de CI versionado no repositório e alguns fluxos que existem no backend mas não estão fechados na interface.

### Classificação atual recomendada

| Uso | Estado recomendado |
| --- | --- |
| Desenvolvimento | **Pronto / maduro para RC** |
| Demonstração pública | **Pronto** |
| Demonstração técnica com fontes públicas | **Pronto** |
| Piloto privado com dados não sensíveis e controle humano | **Pronto condicionalmente** |
| Piloto com documentos reais de parceiro | **Bloqueado até fechar P0 operacional** |
| Produção enterprise | **Não pronta** |

A última mensagem de checkpoint do snapshot analisado registra **138 testes aprovados, 1 ignorado, typecheck e builds cliente/SSR/servidor concluídos**. Isso é evidência histórica do commit, não uma nova execução realizada por esta auditoria. O commit atual também possui status de deploy Vercel bem-sucedido.

---

## 2. Arquitetura atual real

A arquitetura atual **não é Next.js + Supabase como banco principal**.

### Frontend

- React 19.
- TypeScript.
- Vite 7.
- Tailwind CSS 4.
- Wouter para roteamento.
- tRPC + TanStack Query para comunicação e cache.
- Radix/shadcn como base de componentes.
- SSR customizado via Vite para páginas públicas, metadados, canonical, crawler e fallback sem JavaScript.

### Backend

- Node.js.
- Express.
- tRPC.
- Zod para contratos de entrada.
- Drizzle ORM.
- MySQL/TiDB como banco operacional principal através de `DATABASE_URL`.

### Autenticação

- OAuth provido pelo ecossistema Manus/WebDev.
- Identidade interna baseada em `openId`.
- Sessão própria em JWT/cookie.
- Criação inicial de organização restrita ao `OWNER_OPEN_ID` no piloto privado.
- Convites organizacionais com token aleatório, hash, validade, e-mail associado e uso controlado.

### Armazenamento de documentos

- Bytes não ficam no banco.
- Upload e download dependem do serviço Forge/Manus, que fornece URLs pré-assinadas para S3.
- O banco mantém metadados, hash, status, vínculo e decisões.

### Supabase

Supabase está presente, mas com papel **secundário e específico**:

- réplica externa do livro-razão de governança;
- eventos e milestones minimizados;
- `service_role` usada somente no servidor;
- fila local, retry e backoff antes da réplica;
- sanitização de metadados para evitar PII, tokens, conteúdo de documento e segredos.

Portanto:

> **Banco principal:** MySQL/TiDB.  
> **Supabase:** ledger/réplica externa de governança.

### Fluxo resumido

```text
Browser
  ↓
React + Wouter + tRPC React Query
  ↓
Express + tRPC
  ├─ Auth Manus/OAuth + sessão JWT
  ├─ Motor de obrigações
  ├─ Evidências / revisão / RBAC
  ├─ LGPD / leads / auditoria
  ↓
Drizzle
  ↓
MySQL/TiDB

Evidências → Forge/Manus → URL pré-assinada → S3

Eventos de governança
  ↓
Fila local MySQL
  ↓
Supabase REST / ledger externo
```

---

## 3. Organização do repositório

### Código de produto ativo

- `client/src/pages/`
- `client/src/components/`
- `client/src/lib/`
- `server/routers.ts`
- `server/db.ts`
- `server/regularizando.policy.ts`
- `server/regularizando.validation.ts`
- `server/public-validation*.ts`
- `server/governance-sync.ts`
- `server/storage.ts`
- `drizzle/schema.ts`
- `shared/`

### Infraestrutura/plataforma

- `server/_core/`
- `client/public/__manus__/`
- plugin `vite-plugin-manus-runtime`
- autenticação Manus
- Forge Storage
- callbacks de cron autenticados pelo SDK Manus

Parte dessa camada é necessária hoje; outra parte veio do scaffold original e não representa funcionalidade específica do Regularizando.

### Banco e histórico gerado

O repositório possui:

- 21 migrações SQL, de `0000` a `0020`;
- snapshots Drizzle correspondentes;
- journal de migração;
- schema principal extenso com chaves estrangeiras, índices e enums.

Esses arquivos foram tratados como **histórico/estado gerado de schema**, e não como 21 funcionalidades separadas.

### Testes e validações

Existe uma suíte significativa cobrindo, entre outros:

- isolamento cross-tenant;
- RBAC;
- equipe e convites;
- evidências e download;
- rate limiting;
- hardening adversarial;
- LGPD;
- leads;
- motor de obrigações;
- proveniência de fonte;
- validação pública;
- claims públicos;
- SSR;
- acessibilidade estrutural;
- layout GIS/mobile;
- Release Candidate.

### Documentação

`docs/` contém auditorias, baselines, pesquisas, validações, roadmap, segurança, privacidade, GIS, fontes oficiais, piloto e Release Candidate.

É uma base documental rica, porém **não existe atualmente um README raiz que explique qual documento é a fonte de verdade**. Isso favoreceu drift entre arquivos produzidos em checkpoints diferentes.

---

## 4. Funcionalidades prontas

### 4.1 Site público e descoberta

**Estado: implementado.**

Existem rotas públicas para:

- Home;
- Produto;
- Demonstração;
- Implantação e Sucesso;
- Casos de uso;
- Piloto Telecom;
- Contato;
- Segurança/Trust Center;
- Aviso de Privacidade;
- prévia interna de direções de marca.

Há metadados por rota, canonical, robots, sitemap, favicon, SSR e tratamento de 404/noindex.

A demonstração pública é corretamente apresentada como **ilustrativa**, e o próprio código afirma que ela não executa extração em tempo real nem representa dados de cliente.

### 4.2 Workspace autenticado e multi-tenant

**Estado: implementado.**

- organizações;
- membros;
- papéis `owner`, `admin`, `analyst`, `reviewer`, `viewer`;
- escopo por `organizationId`;
- criação privada da primeira organização;
- convites com expiração;
- aceite de convite associado ao e-mail autenticado;
- atribuição de responsáveis.

O isolamento é implementado na aplicação e possui testes negativos cross-tenant.

### 4.3 Dashboard operacional

**Estado: implementado.**

CRUD/fluxos disponíveis para:

- sites;
- licenças;
- condicionantes;
- CAPA / ações corretivas;
- incidentes e quase acidentes;
- métricas ESG;
- evidências e revisões.

O dashboard deriva indicadores a partir dos registros reais da organização e evita preencher o workspace autenticado com dados fictícios.

### 4.4 Motor de Licenciamento & Obrigações

**Estado: implementado e é o núcleo mais maduro do produto.**

O fluxo atual preserva:

1. fonte;
2. origem oficial/documental;
3. jurisdição e nível de autoridade;
4. vigência;
5. perfil setorial;
6. requisito;
7. critérios de aplicabilidade;
8. versão;
9. locator/página/trecho de origem;
10. confirmação humana de escopo;
11. prazo;
12. responsável;
13. evidência;
14. revisão humana;
15. decisão justificada.

Existem ainda:

- catálogo oficial global separado de organizações;
- importação explícita para uma organização;
- conflitos entre fontes sem resolução automática;
- onboarding documental;
- bloqueios contra fonte/versão inadequada;
- decisões imutáveis associadas à versão usada.

A arquitetura evita tratar um perfil setorial ou uma automação como conclusão jurídica automática.

### 4.5 Validação pública com fontes oficiais

**Estado: implementado.**

Há domínio próprio para casos públicos, sem `organizationId` e sem simular clientes privados.

O parser público:

- extrai condicionantes numeradas de texto;
- identifica prazos em padrões suportados;
- identifica recorrência;
- só preenche evidência esperada quando expressa no trecho;
- mantém aplicabilidade pendente de revisão técnica.

Os documentos internos registram validação com fontes públicas oficiais do IBAMA e preservação de URL, hash, locator/página e trecho.

### 4.6 Segurança documental

**Estado: backend forte, fluxo de interface parcialmente incompleto.**

O backend implementa:

- limite de 8 MB;
- allowlist de formatos;
- comparação entre extensão, MIME e assinatura;
- validação de PDF/JPEG/PNG;
- inspeção de DOCX/XLSX como ZIP;
- bloqueio de macros VBA;
- bloqueio de relações externas;
- path traversal;
- estruturas truncadas;
- limites de número de entradas;
- limite de expansão descompactada;
- defesa contra razão de compressão anormal;
- SHA-256;
- quarentena;
- verificação de integridade antes de autorização;
- autorização humana separada para processamento e download;
- URL assinada somente após autorização;
- auditoria de ações.

**Limite explícito:** não existe antimalware/sandbox. A própria aplicação registra `quarantined_unscanned` e não deve declarar o arquivo como limpo.

### 4.7 Equipe, revisão e responsabilidade

**Estado: implementado.**

- convites;
- papéis;
- lista de membros;
- revogação de convite;
- atribuição de responsáveis a CAPA;
- atribuição de revisores;
- revisão humana de evidências;
- responsáveis por obrigação.

### 4.8 LGPD e retenção

**Estado: implementado como governança operacional, com revisão jurídica ainda necessária.**

- políticas de retenção por categoria;
- versionamento de políticas;
- aprovação humana;
- pseudonimização da referência de titular com SHA-256;
- pedidos de acesso/exportação/correção/eliminação/anonimização/oposição;
- atribuição de responsável;
- eventos/evidências;
- decisão;
- execução;
- encerramento;
- audit trail;
- ausência deliberada de exclusão automática.

### 4.9 Leads e solicitações públicas

**Estado: implementado.**

- captura consentida de pedido de piloto;
- captura de pedido de privacidade;
- separação entre contato de privacidade e lead comercial;
- qualificação `captured → MQL → SQL → converted/disqualified`;
- acesso global restrito a administrador;
- réplica externa minimizada.

### 4.10 Auditoria e governança externa

**Estado: implementado no código.**

- `auditEvents` locais;
- eventos globais de governança;
- fila persistente;
- status `pending/synced/failed`;
- retry com backoff;
- milestones;
- sanitização de metadados;
- sincronização REST com Supabase;
- cron autenticado para recuperação.

---

## 5. Funcionalidades que parecem existir, mas não devem ser consideradas prontas

### 5.1 Extração automática de DOCX/XLSX/CSV de cliente

**Não implementada como fluxo operacional real.**

O backend valida estruturalmente esses arquivos, e existe parser específico para texto dos casos públicos, mas não existe pipeline operacional completo de upload de documento privado → extração automática → campos ambientais → revisão.

A página `/demonstracao` usa a expressão “leitura assistida”, porém deixa explícito que é uma simulação educativa e não uma extração em tempo real.

### 5.2 GIS operacional

**Não implementado como análise territorial real de ativo.**

O produto possui comunicação, validações de layout e guardrails de GIS, porém mantém corretamente a premissa de que não há sobreposição, raio ou alerta real sem coordenadas e fontes de camada reais.

### 5.3 IA no produto

**Não considerar ativa.**

Existem utilitários genéricos herdados do scaffold (`llm`, `imageGeneration`, `voiceTranscription`, `AIChatBox`), mas eles não compõem hoje o motor regulatório principal nem devem ser usados como evidência de uma feature de IA entregue.

A arquitetura de segurança já define documentos como `UNTRUSTED_DOCUMENT_CONTENT`, o que é positivo para uma futura camada assistida por IA.

---

## 6. Inconsistências organizadas

### 6.1 Arquitetura e documentação

#### `template.json` está obsoleto

O arquivo ainda descreve um template **“Web App (static only)”**, enquanto a aplicação atual é full-stack, com Express, tRPC, Drizzle, OAuth, storage, SSR e banco.

**Classificação:** legado de scaffold.  
**Ação futura:** arquivar/remover ou marcar explicitamente como artefato de origem.

#### Documentos de status de datas diferentes contradizem o código atual

Exemplo: `docs/validation-roadmap-status.md` ainda descreve rate limiting em memória e ausência de quarentena, enquanto o código e `security-hardening-verification.md` já implementam buckets compartilhados, quarentena, hash e autorizações separadas.

Também existem diferentes contagens históricas de testes: 83, 101, 117, 125, 128, 135 e 138 em checkpoints distintos.

**Classificação:** documentação histórica correta no momento em que foi escrita, mas sem uma fonte de verdade consolidada.  
**Ação:** este `PROJECT_STATUS.md` deve virar a página inicial de estado; docs antigas devem ganhar rótulo `historical snapshot` quando revisadas.

### 6.2 Supabase

Alguns textos históricos usam linguagem que pode sugerir “integração Supabase” como banco do produto. No código atual isso precisa ser lido de forma precisa:

- MySQL/TiDB = banco principal;
- Supabase = ledger de governança externo.

O teste `supabase-connection.test.ts` também consulta uma tabela `audit_logs` para a sonda de leitura, enquanto o fluxo atual de replicação grava `regularizando_governance_events` e `regularizando_governance_milestones`.

**Ação:** documentar formalmente o contrato das tabelas externas e separar teste de infraestrutura opt-in da suíte unitária normal.

### 6.3 Evidências: backend e UI não estão alinhados

Este é o principal gap funcional encontrado.

O backend possui `evidences.authorize` para duas autorizações humanas separadas:

- `processing`;
- `download`.

A tela `Evidences.tsx`, porém, expõe:

- upload;
- decisão da revisão (`aprovada/rejeitada`);
- tentativa de download.

Não há consumo de `evidences.authorize` no frontend analisado.

Como o download exige `approved_for_processing` **e** `downloadAuthorizedAt`, o controle está corretamente fechado no servidor, mas o usuário não possui o caminho de interface correspondente.

**Classificação:** P0 de UX/operação.  
**Não é uma falha de autorização; é um fluxo incompleto entre backend e frontend.**

### 6.4 Formatos de upload inconsistentes

O backend aceita:

- PDF;
- DOCX;
- XLSX;
- CSV;
- JPG/JPEG;
- PNG.

A UI de Evidências declara e aceita no seletor somente:

- PDF;
- JPG;
- PNG;
- DOCX.

Além disso, a constante exportada `permittedEvidenceTypes` não inclui XLSX/CSV, embora `validateEvidenceUpload` inclua.

**Ação:** escolher uma única allowlist compartilhada entre frontend/backend/testes.

### 6.5 Identidade visual e nomenclatura

Há três camadas históricas convivendo:

- `ideas.md` escolhe **Observatório Terra**;
- `design-system/regularizando/MASTER.md` representa a direção anterior;
- `design-system/regularizando-rastro/MASTER.md` representa a fase Rastro;
- o produto público e os metadados continuam usando principalmente o nome **Regularizando**;
- existe rota interna de direções de marca e o backlog mantém validação/aplicação final da nova marca como pendência humana.

**Ação:** decidir formalmente se “Rastro” é sistema visual, submarca ou nome de produto e arquivar a direção Observatório Terra como histórica.

### 6.6 Resíduos de scaffold

Foram identificados artefatos sem papel claro no runtime atual:

- `server/index.ts`: servidor estático antigo; os scripts usam `server/_core/index.ts`;
- `drizzle/relations.ts`: contém apenas import vazio;
- alias `@assets` aponta para `attached_assets`, diretório ausente na árvore;
- `ManusDialog.tsx` sem consumo encontrado;
- `AIChatBox.tsx` aparece no showcase, não no produto principal;
- serviços genéricos `_core` de imagem, LLM e voz não equivalem a features do Regularizando.

**Ação:** após estabilizar o piloto, fazer uma limpeza de legado em PR dedicado, com prova de build/testes.

### 6.7 Documentação de entrada ausente

Não existe `README.md` raiz nem `.env.example`.

Isso é relevante porque o runtime depende de várias variáveis, incluindo:

- `DATABASE_URL`;
- `JWT_SECRET`;
- `VITE_APP_ID`;
- `OAUTH_SERVER_URL`;
- `OWNER_OPEN_ID`;
- `BUILT_IN_FORGE_API_URL`;
- `BUILT_IN_FORGE_API_KEY`;
- `SUPABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `CANONICAL_ORIGIN`;
- outras variáveis de deploy/agendamento.

A configuração atual usa strings vazias como fallback em vários pontos e não existe validação central fail-fast do ambiente na inicialização.

### 6.8 CI e deploy

Não existe `.github/workflows/` na árvore analisada.

O commit possui check Vercel com sucesso, portanto há integração externa de deploy, mas **typecheck/test/build não estão codificados como pipeline de CI versionado no repositório**.

### 6.9 Multi-organização por usuário

O schema permite memberships organizacionais, mas `getOrganizationForUser()` escolhe a membership mais recente e a interface não apresenta seletor de organização.

Para o piloto de uma organização isso é aceitável. Para um SaaS em que um consultor participa de vários clientes, precisará existir seleção explícita de workspace e contexto persistido.

### 6.10 Pedidos públicos de privacidade e fluxo interno

Pedidos públicos são armazenados em `pilotRequests` com `requestCategory = privacy` e ficam visíveis na área global de leads/contatos. O próprio UI orienta encaminhamento humano para o fluxo LGPD.

Não há automação que converta automaticamente esse contato público em `dataSubjectRequests` de uma organização, o que hoje é coerente com a necessidade de determinar controlador/contexto, mas deve ser formalizado como procedimento operacional.

---

## 7. Riscos atuais

### Alto

#### 1. Documentos reais antes de antimalware/sandbox

A validação estrutural é forte, mas não substitui antimalware. Não carregar documentos sensíveis/reais de parceiro em escala antes de definir esse controle ou uma política formal de aceite de risco.

#### 2. Acoplamento à Manus

Hoje dependem da plataforma:

- OAuth;
- identidade `openId`;
- cron autenticado;
- Forge Storage;
- URLs de storage;
- plugins/runtime de desenvolvimento.

Migrar para infraestrutura independente exigirá substituir mais do que o deploy do frontend.

#### 3. Fluxo de autorização documental incompleto na UI

O servidor impede acesso indevido, mas operadores autorizados não têm na interface atual o caminho explícito para liberar processamento e download.

#### 4. Continuidade ainda não comprovada

Não há evidência no repositório de:

- restore independente executado;
- RPO aprovado;
- RTO aprovado;
- política real de backup dos provedores testada de ponta a ponta.

#### 5. Identidade enterprise não comprovada

MFA, verificação de e-mail, revogação e recuperação são dependências do provedor OAuth e precisam ser verificadas operacionalmente antes de um piloto com dados reais.

### Médio

#### 6. Isolamento depende da aplicação

O isolamento principal é feito por `organizationId` e autorização no servidor. MySQL/TiDB não fornece RLS equivalente ao PostgreSQL usado como última barreira em alguns SaaS.

A suíte adversarial reduz o risco, mas cada nova rota precisa manter a disciplina de escopo.

#### 7. `routers.ts` e `db.ts` estão grandes e concentrados

A centralização ajuda a auditar uma RC pequena, mas aumenta custo de manutenção e risco de regressão conforme o produto crescer.

#### 8. Ausência de CI versionado

Checks históricos são bons sinais, mas sem CI no repositório uma alteração pode chegar à `main` sem a mesma barreira automática.

#### 9. Drift documental

Existem vários relatórios corretos para checkpoints antigos, porém algumas afirmações ficaram superadas por implementações posteriores.

#### 10. Dependências de ambiente não validadas no startup

Variáveis críticas podem ficar vazias até o código atingir uma rota específica.

### Baixo / dívida técnica

- alias de assets sem diretório correspondente;
- `relations.ts` vazio;
- servidor estático legado;
- componentes/showcases de scaffold;
- dois design systems concorrentes;
- `template.json` obsoleto;
- diferença entre versão de `pnpm` declarada como package manager e dependência de desenvolvimento.

---

## 8. Pendências priorizadas

## P0 — antes de documentos reais ou piloto operacional

1. **Fechar o fluxo de evidências na UI.**
   - mostrar estado de quarentena;
   - ação explícita para autorizar processamento;
   - ação separada para autorizar download;
   - justificativa;
   - responsável/data;
   - feedback de integridade divergente;
   - teste E2E do fluxo completo.

2. **Unificar formatos de upload.**
   - uma allowlist compartilhada;
   - decidir suporte oficial a XLSX/CSV;
   - atualizar `accept`, texto da UI e testes.

3. **Definir se XLSX/CSV serão apenas evidência ou entrada estruturada.**
   - hoje são apenas arquivos validados/armazenados;
   - não existe ingestão ambiental automática de planilha.

4. **Adicionar antimalware/sandbox ou formalizar bloqueio de documentos reais até existir esse controle.**

5. **Executar e registrar restore real.**
   - banco;
   - storage;
   - responsabilidade;
   - tempo observado;
   - perda máxima observada.

6. **Validar operacionalmente OAuth.**
   - MFA;
   - verificação de e-mail;
   - revogação;
   - recuperação;
   - expiração/retenção de sessão.

7. **Confirmar TTL real das URLs assinadas.**

8. **Reexecutar em ambiente limpo o snapshot atual.**
   - `pnpm check`;
   - `pnpm test`;
   - `pnpm build`;
   - migração em banco descartável;
   - seed de validação pública;
   - fluxos críticos E2E.

9. **Adicionar CI versionado.**
   - install com lockfile;
   - typecheck;
   - testes;
   - build;
   - checagem de migração;
   - secret scanning/dependency audit quando aplicável.

10. **Criar documentação mínima de operação.**
    - `README.md`;
    - `.env.example` sem segredos;
    - matriz de ambientes;
    - fluxo de deploy;
    - dependências Manus/Vercel/Supabase/MySQL/S3;
    - procedimento de rollback.

## P1 — antes de escalar o SaaS

1. Definir estratégia de desacoplamento ou permanência na Manus.
2. Separar `server/routers.ts` por domínio.
3. Separar `server/db.ts` em repositórios/serviços por domínio.
4. Implementar seleção explícita de organização/workspace se um usuário puder atuar em vários clientes.
5. Consolidar documentação e marcar snapshots históricos.
6. Consolidar identidade visual e arquivar direções antigas.
7. Limpar scaffold morto em PR isolado.
8. Centralizar schema de configuração/env e falhar cedo quando variável crítica estiver ausente.
9. Formalizar o encaminhamento de pedido público de privacidade ao controlador/organização correta.
10. Criar observabilidade operacional: erros, jobs, fila Supabase, storage, rate-limit, integridade e eventos críticos.

## P2 — evolução de produto

1. Pipeline real de ingestão de DOCX/XLSX/CSV.
2. Extração assistida com proveniência por célula/trecho.
3. Detecção de lat/long/UTM e normalização espacial.
4. Ingestão de parâmetros ambientais e séries de monitoramento.
5. GIS real com camadas, origem, data de atualização e regras de escopo.
6. IA apenas depois de manter a fronteira `UNTRUSTED_DOCUMENT_CONTENT` e adicionar avaliação, observabilidade e aprovação humana.
7. Integrações/API-first para ERP, GED, GIS ou ferramentas de clientes quando houver demanda comprovada.

---

## 9. Próximo marco recomendado

### “Piloto privado operável de ponta a ponta”

Não criar novos módulos antes de fechar este marco.

Critérios de aceite sugeridos:

- [ ] build/typecheck/test atuais executados em CI;
- [ ] deploy reproduzível documentado;
- [ ] organização + convite + papéis validados;
- [ ] fonte oficial → requisito → versão → revisão → aplicação funcionando;
- [ ] upload → quarentena → revisão → autorização de processamento → autorização de download funcionando pela UI;
- [ ] antimalware/sandbox definido ou documentos reais formalmente proibidos;
- [ ] restore testado;
- [ ] TTL de URL assinada comprovado;
- [ ] MFA/verificação de e-mail do provedor confirmados;
- [ ] políticas de retenção e fluxo LGPD revisados;
- [ ] contrato/DPA/escopo concluídos antes de dados de parceiro;
- [ ] monitoramento de falha dos jobs e da réplica Supabase disponível;
- [ ] marca pública decidida e conferida manualmente em desktop/mobile.

---

## 10. Fonte de verdade recomendada

A partir deste checkpoint, usar a seguinte hierarquia:

1. **Código + schema + testes do commit atual** — verdade de implementação.
2. **`PROJECT_STATUS.md`** — verdade consolidada de estado/maturidade.
3. **`todo.md`** — backlog operacional.
4. **docs de segurança/RC** — evidências e decisões do checkpoint correspondente.
5. **`ideas.md`, `research-notes.md`, design systems antigos e relatórios estratégicos** — contexto histórico/estratégico, não descrição da arquitetura atual.
6. **`template.json`** — artefato de origem do scaffold, não documentação do produto atual.

---

## 11. Conclusão

O Regularizando já possui um **núcleo SaaS ambiental sério e defensável**, especialmente no motor de obrigações, proveniência, revisão humana, isolamento, governança documental e transparência sobre limitações.

O principal trabalho agora não é adicionar mais telas. É transformar uma RC tecnicamente rica em um sistema operacionalmente fechado:

- alinhar backend e UI;
- comprovar controles externos;
- remover ambiguidade de plataforma e documentação;
- automatizar qualidade em CI;
- provar recuperação;
- fechar segurança de arquivos;
- só então introduzir dados reais e novas automações.

**Estado final desta auditoria:** **RC pré-piloto robusta, pronta para demonstração e validação controlada; piloto com dados reais ainda condicionado a P0 operacional.**
