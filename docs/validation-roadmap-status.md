# Regularizando — estado de validação e prontidão

**Data de consolidação:** 14 de agosto de 2026  
**Escopo:** Motor de Obrigações, plataforma SaaS, segurança, privacidade e operação técnica.  
**Regra de leitura:** este documento separa controles comprovados no código e nas validações automatizadas de controles que dependem de configuração de provedor, decisão do controlador ou futuro parceiro. Não atribui certificados, criptografia gerenciada, backup, conformidade LGPD ou capacidades de identidade sem evidência formal.

> A ausência de documentos privados de um cliente **não bloqueia a entrega técnica atual**. Ela limita somente a criação de instâncias reais de obrigação, evidências reais de cumprimento e análises territoriais de um ativo específico.

## Roadmap formal de validação

| Nível | Estado | Escopo e critério |
|---|---|---|
| **A — Validação técnica com fontes públicas oficiais** | **CONCLUÍDO** | Casos segregados com LO nº 1660/2022, LO nº 1668/2024 e guia do IBAMA; cadeia fonte → condicionante → requisito público → evidência esperada → revisão humana → decisão; URLs oficiais, hashes, páginas/locators, trechos e método de extração preservados. Há 83 testes aprovados e não há organização, ativo, cliente ou evidência de cumprimento fictícia. |
| **B — Validação com ativo real anonimizado** | **AGUARDANDO FUTURO PARCEIRO** | Aplicação do fluxo a documentos e metadados autorizados de um ativo real, com minimização/anonimização acordada. Não é bloqueador da plataforma atual e não será preenchido com dados simulados. |
| **C — Piloto comercial com ativos reais** | **FUTURO** | Operação com organização parceira, autorização de tratamento, identidade e governança operacional aprovadas. Será iniciado somente com definição do controlador e autorização apropriada. |

## Nível A — o que está efetivamente implementado

As fontes públicas selecionadas são mantidas em um domínio global independente de organizações. O domínio contém `publicValidationCases`, `publicValidationSources`, `publicValidationFindings` e `publicValidationRequirements`; nenhuma dessas tabelas possui `organizationId`, ativo, coordenada ou vínculo a evidência de cliente. A demonstração é restrita a administradores em `/validacao-tecnica`, marcada como rota privada e sem indexação. Ela permite registrar uma decisão humana com justificativa, mas não cria uma obrigação de cliente.

Os trechos selecionados não são uma transcrição integral de todas as condicionantes dos documentos. A LO nº 1660/2022 foi lida por extração nativa; a LO nº 1668/2024 foi lida por OCR em português e permanece marcada para conferência visual. Prazos, recorrências e evidências esperadas só são estruturados quando aparecem no trecho original; campos sem base permanecem vazios e a aplicabilidade fica obrigatoriamente pendente de revisão técnica. O registro detalhado de proveniência, escopo e referências está em `docs/public-validation-source-register.md`.

## Testes e verificações

O checkpoint atual executou **83 testes aprovados, 1 teste conscientemente ignorado e build de produção concluído**. A suíte cobre autorização de autenticação, isolamento de evidências entre organizações, equipe e convites, regras de obrigações, fontes e conflitos, SSR público, acessibilidade estrutural, leads, sincronização de governança e o domínio de validação pública.

| Grupo de verificação | Cobertura comprovada |
|---|---|
| Motor público | Parser sem regra específica por número de licença, prazo mínimo, prazo expresso, recorrência, ausência de evidência sem trecho, estados de revisão e aplicabilidade pendentes. |
| Proveniência | URL governamental, hash SHA-256, locator/página, trecho original e método de extração em regressão permanente. |
| Isolamento | Casos públicos sem chave organizacional; acesso administrativo à demonstração; testes negativos de recursos entre tenants em fluxos operacionais. |
| Segurança de arquivos | Upload validado; download somente via procedimento autenticado, com confirmação de organização e URL temporária; eventos de upload/download/revisão auditados. |
| Governança | Fila local idempotente, réplica minimizada no Supabase, marcos de checkpoint/publicação e exclusão de PII, segredos, URLs assinadas e bytes do livro-razão externo. |

## Estado de arquitetura, segurança e privacidade

| Tema | Implementado e verificável | Limite conhecido ou hardening ainda necessário |
|---|---|---|
| **Banco principal** | MySQL/TiDB com Drizzle, chaves estrangeiras, índices, isolamento por `organizationId`, logs de auditoria append-only e fila de governança. | Criptografia em repouso/em trânsito, auditoria de queries, privilégios da credencial, backup administrado, RPO e RTO dependem de evidência do provedor e de operação formal. |
| **Auth** | OAuth Manus, sessão verificada no servidor, criação privada de organizações e convites com token aleatório hasheado, e-mail vinculado, uso único e sete dias de validade. | MFA, verificação de e-mail, revogação, recuperação e retenção de sessão são controles do provedor e não foram confirmados nesta entrega. |
| **RBAC e isolamento** | Papéis `owner`, `admin`, `analyst`, `reviewer` e `viewer`; permissões avaliadas no servidor; escopo organizacional e testes negativos cross-tenant. | MySQL/TiDB não oferece RLS nativo equivalente ao PostgreSQL. A matriz de procedimentos mutáveis deve continuar crescendo a cada módulo novo. |
| **RLS externo** | O livro-razão de governança no Supabase usa RLS, políticas de negação direta e imutabilidade de eventos; escrita é de servidor. | Isso protege somente a réplica externa e não substitui o RBAC/isolamento do banco principal. Uma função legada de convite com `SECURITY DEFINER` foi inspecionada e requer revisão dedicada antes de qualquer alteração. |
| **Storage** | Bytes ficam em S3; upload valida tipo, extensão, tamanho e consistência; download exige contexto organizacional e retorna URL temporária. | Antivírus, quarentena de upload, DLP/classificação e monitoramento avançado de arquivos não estão comprovados. |
| **Auditoria** | `auditEvents` locais para ações sensíveis e réplica externa minimizada para eventos e marcos técnicos. | A trilha não substitui SIEM, SOC, retenção regulatória formal ou resposta 24×7. |
| **Rate limiting** | Limite em memória de 120 requisições/minuto por IP para `/api/trpc`. | Não é distribuído nem persistente entre instâncias; proteção contra abuso em escala exige camada compartilhada/edge e telemetria operacional. |
| **Backups e restore** | Separação arquitetural entre dados no banco e bytes no storage; baseline operacional exige teste de restauração. | Não existe neste repositório evidência de backup, teste de restore, RPO ou RTO aprovados. |
| **Criptografia** | Segredos permanecem em configuração de servidor; o código não envia `service_role` ao cliente; links de download são temporários. | Criptografia de infraestrutura, KMS, gestão de chaves e TLS efetivo precisam ser comprovados por configuração/atestado dos provedores. |
| **LGPD** | Consentimento para solicitação de piloto, minimização na réplica de governança e separação de documentos/PII de logs externos. | Ainda faltam aviso de privacidade aprovado, registro de operações, definição de controlador/operador, bases legais, tabela de retenção, fluxo de direitos do titular, descarte/anonimização, subprocessadores e plano de incidente aprovado. |
| **Cibersegurança contínua** | Hardening de download, logs, isolamento e limite de taxa foram implementados e testados. | Pentest periódico, gestão de vulnerabilidades/patches, monitoramento de ameaças, treinamento anti-phishing, ISO 27001, SOC 2 e certificações equivalentes não são controles ou certificados comprovados. |

## Prontidão por uso

| Cenário | Situação atual |
|---|---|
| **Demonstração técnica** | Pronta. A rota interna `/validacao-tecnica` demonstra o motor com documentos oficiais, sem dados de cliente. O site público, SSR, produto, casos de uso, segurança e contato estão publicados. |
| **Demonstração operacional com dados não sensíveis** | Pronta com o fluxo de organizações, equipe, fontes, obrigações, evidências e revisão humana, desde que os dados usados tenham autorização e respeitem o baseline operacional. |
| **Piloto privado com organização parceira** | A base técnica está pronta para configuração controlada: organização criada pelo administrador, convites, RBAC, storage autorizado e auditoria. A entrada de dados reais exige, antes, evidências externas de identidade, retenção, backup/restore, RPO/RTO e responsabilidades de tratamento. |
| **Piloto comercial amplo ou autoatendimento** | Futuro. Requer hardening operacional complementar, decisão do controlador, governança LGPD e validação de capacidade/abuso em ambiente de produção. |

## Dependências exclusivas de futuro parceiro

As funcionalidades abaixo não estão incompletas; elas requerem dados e autorização que o produto não pode inventar. A plataforma já oferece os mecanismos, mas a instância real só pode existir quando houver parceiro autorizado.

| Capacidade | Dependência específica | Por que casos públicos não substituem |
|---|---|---|
| Aplicar requisito a um ativo | Licença, condicionantes, vigência, escopo, perfil setorial e confirmação humana do empreendimento. | Um documento público permite testar extração e revisão, mas não identifica a aplicabilidade jurídica ou operacional de outro empreendimento. |
| Prazo e responsável reais | Condicionante aplicável, processo, responsáveis e data de referência do parceiro. | Não é seguro transferir prazo, frequência ou autoridade de uma licença pública para um cliente diferente. |
| Evidência de cumprimento | Laudo, registro operacional ou documento autorizado do parceiro. | A plataforma não deve fabricar evidência, aprovação ou não conformidade. |
| Leitura GIS territorial | Coordenadas autorizadas, fontes de camada e período de atualização aplicável ao ativo. | O caso público não autoriza inferir localização ou sobreposição para ativo privado. |
| Piloto comercial | Organização parceira, autorização de tratamento e definição contratual de papéis. | O fluxo técnico não substitui a base legal, o contrato ou a autorização do controlador. |

## Conclusão

O **Nível A está concluído**. A plataforma tem uma validação técnica pública rastreável, com revisão humana, regressões e isolamento de dados. Os níveis B e C são fases futuras de adoção com parceiro, não pendências do desenvolvimento atual. Nenhum dado fictício deve ser criado para antecipá-los.
