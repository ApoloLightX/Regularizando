# Rastreabilidade de governança — Regularizando

**Estado:** implementado para eventos de aplicação e marcos técnicos; sujeito à validação operacional contínua.  
**Objetivo:** manter uma trilha minimizada, consultável e reproduzível sobre mudanças relevantes do produto sem replicar segredos, documentos privados ou dados pessoais desnecessários.

> O banco operacional do Regularizando continua sendo a fonte de verdade para o produto. O Supabase recebe uma réplica de **metadados de governança**, não uma cópia de documentos, arquivos de evidência ou dados completos de clientes.

## Arquitetura de rastreabilidade

| Camada | Finalidade | Conteúdo permitido | Garantia |
|---|---|---|---|
| GitHub | Histórico versionado de código, migrações, testes e documentos. | Código e documentação revisáveis; nunca segredos. | Commit e push para o repositório remoto. |
| Banco principal | Fonte de verdade dos registros operacionais e fila de réplica. | Eventos, estado de entrega, marcos e referências internas. | Chaves únicas, timestamps UTC e recuperação por fila. |
| Supabase | Livro-razão externo de metadados de governança. | Tipo de evento, ação, referência pseudonimizada, campos técnicos e instante. | Tabelas com RLS habilitado, unicidade de origem e bloqueio de `UPDATE`/`DELETE`. |

O fluxo é **evento confirmado → fila local → tentativa imediata → Supabase**. Caso o destino externo esteja indisponível, o evento permanece no banco principal com estado de falha, contador de tentativas e próximo horário de recuperação. O processo agendado usa uma identidade exclusiva de tarefa e confere seu identificador persistido antes de processar a fila.

## Eventos cobertos automaticamente

| Domínio | Exemplos de mutação | Evento externo minimizado | Dados deliberadamente excluídos |
|---|---|---|---|
| Site e operação | Cadastro de sites, licenças, condicionantes, incidentes, CAPAs e indicadores. | Categoria, procedimento, tipo de fluxo e instante. | Título livre, descrição operacional e conteúdo de documentos. |
| Autenticação e acesso | Aceite de convite, gestão de equipe e logout. | Alteração de acesso e referência pseudonimizada do ator. | E-mail, token, hash de convite, cookie e credenciais. |
| Cibersegurança | Upload, download autorizado e revisão de evidências. | Classe de operação, tipo de evidência e resultado de fluxo. | Chave de armazenamento, URL assinada, nome de arquivo e bytes. |
| Leads | Solicitação pública de piloto com consentimento. | Evento de captação e campos técnicos do procedimento. | Nome, e-mail, empresa, cargo, desafio e qualquer nota comercial. |
| Governança de dados | Fontes, requisitos, versões, conflitos, obrigações e revisões. | Tipo de mudança, referência do recurso e estado técnico. | Texto normativo integral, justificativas, racional de revisão e escopo livre. |

## Matriz de segurança e maturidade

| Tema | Controles comprovados no produto | Limites e pendências que não são declarados como concluídos |
|---|---|---|
| Identidade | OAuth Manus, sessão no servidor, associação de usuário à organização e acesso privado por convite. | MFA, verificação de e-mail, revogação e recuperação dependem de confirmação do provedor. |
| Autorização | Papéis organizacionais, validação de escopo no servidor e testes negativos entre organizações. | Matriz integral de todos os papéis e procedimentos deve continuar evoluindo conforme surgem módulos novos. |
| Arquivos | Upload validado, bytes em storage, download por URL temporária após validação organizacional e auditável. | Antivírus/quarentena e detecção avançada de ameaça não estão comprovados nesta entrega. |
| Banco principal | Modelo multi-tenant, chaves estrangeiras, índices e registros de auditoria locais. | Criptografia de infraestrutura, auditoria de consultas, backup administrado, RPO e RTO não podem ser inferidos do código. |
| Livro-razão Supabase | RLS habilitado nas tabelas, registros externos imutáveis por trigger e segredo exclusivo de servidor. | O Supabase não substitui as autorizações do MySQL/TiDB nem prova por si só a conformidade integral do produto. |
| Resposta a incidentes | Baseline operacional para conter, preservar evidências, avaliar impacto, corrigir e comunicar quando aplicável. | Pentest periódico, SOC 2, ISO 27001, monitoramento contínuo e treinamento anti-phishing não são certificações ou controles comprovados nesta entrega. |
| Leads e CRM | Consentimento de solicitação de piloto, minimização de dados na réplica e registro do evento de captação. | Pipeline comercial MQL/SQL, nutrição, CRM externo, scoring e automações de marketing ainda precisam de um escopo próprio. |

## Verificação do Supabase

Após a criação do livro-razão, a verificação de segurança deixou de apontar as duas tabelas de governança por ausência de política ou a função de imutabilidade por `search_path` mutável. As tabelas permanecem com RLS e uma política explícita de negação para clientes diretos; a escrita ocorre somente pelo serviço de servidor com chave `service_role`.

Permanece um alerta externo para a função legada `public.accept_organization_invitation(text)`, que é `SECURITY DEFINER` e executável por usuários autenticados. A função foi apenas **inspecionada**, não alterada nesta entrega: ela exige identidade autenticada, confere o e-mail do convite, compara token hasheado e bloqueia a linha durante o aceite. Como sua alteração pode interromper um fluxo externo já existente, qualquer revogação ou mudança de modo deve passar por uma revisão específica de dependências e testes do fluxo de convite.

## Consolidações por marco

Além dos eventos de aplicação, os marcos abaixo entram no mesmo fluxo de réplica:

| Marco | Referência obrigatória | Conteúdo resumido |
|---|---|---|
| Checkpoint | Identificador de versão publicado. | Alteração entregue, validações realizadas e escopo técnico. |
| Publicação | Versão e domínio afetado. | Resultado da publicação e evidência de disponibilidade. |
| Revisão de segurança | Documento ou ticket de revisão. | Controles verificados, lacunas e decisão de risco. |
| Mudança de esquema | Migração e versão. | Tabelas, impacto esperado e validação aplicada. |
| Revisão operacional | Registro interno de governança. | Responsável, decisão e próxima revisão. |

## Regras de dados

1. **Nunca** registrar chaves, senhas, cookies, tokens, URLs assinadas, hashes de convite, bytes, documentos, evidências ou conteúdo integral de mensagens na réplica externa.
2. Para usuários e organizações, usar referências técnicas (`user:ID` e `organization:ID`), e não nome, e-mail ou empresa.
3. Registrar a origem com uma chave única, para que a réplica seja idempotente mesmo após tentativas repetidas.
4. Tratar falha do Supabase como falha de entrega, não como perda de evento: a fila local preserva o evento para nova tentativa.
5. Tratar certificações, criptografia gerenciada, backups do provedor, RPO/RTO e controles de identidade externos como itens que exigem evidência formal antes de aparecerem como garantia comercial.

## Operação e auditoria

O procedimento de recuperação é exclusivo para chamadas agendadas autenticadas. A tarefa só processa a fila quando seu identificador coincide com o controle persistido no banco. As consultas executivas devem usar as tabelas externas `regularizando_governance_events` e `regularizando_governance_milestones`; a investigação operacional detalhada permanece no banco principal, sob autorização por organização.

Antes de usar a plataforma com dados reais fora do piloto privado, manter válidos os gates já definidos para identidade, retenção, descarte, backup, restauração e resposta a incidentes no documento `pilot-security-operating-baseline.md`.
