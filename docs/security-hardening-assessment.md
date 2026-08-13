# Parecer técnico inicial de hardening — Regularizando

**Data da revisão:** 11 de agosto de 2026.  
**Escopo:** código do servidor, rotas tRPC, autenticação da plataforma, modelagem multi-tenant e fluxo de evidências.  
**Limite da avaliação:** esta é uma revisão de implementação e arquitetura; não comprova configurações do provedor, criptografia de infraestrutura, backups administrados ou a conformidade jurídica da operação.

## Conclusão executiva

O feedback recebido está **correto na direção**: a plataforma não deve ser apresentada como pronta para receber dados reais de clientes sem uma fase explícita de hardening. Porém, sua recomendação técnica precisa ser adaptada à arquitetura real do Regularizando. O produto não usa Supabase/Postgres: utiliza **MySQL/TiDB, Express/tRPC, OAuth Manus e S3 gerenciado**. Por isso, RLS do PostgreSQL não é um controle disponível; o isolamento deve ser defendido no servidor, por consultas obrigatoriamente escopadas, autorização centralizada, testes negativos de tenant e uma credencial de banco com privilégios mínimos.

Há controles já implementados e verificáveis: os procedimentos de negócio são protegidos por sessão autenticada; a organização e o papel são resolvidos no servidor; consultas do painel usam `organizationId`; referências entre entidades passam por verificação de pertencimento; convites são hashados, expiram em sete dias, são de uso único e vinculados ao e-mail autenticado. A maior lacuna encontrada no código é o **acesso a evidências**: a rota genérica `/manus-storage/*` obtém uma URL assinada sem validar sessão, organização ou permissão. Uma chave de arquivo conhecida ou compartilhada pode, portanto, ser reutilizada para solicitar o redirecionamento. Esse fluxo deve ser substituído antes do uso com documentos reais.

## Mapeamento do feedback à aplicação

| Tema do feedback | Estado verificável no código | Avaliação | Próxima decisão técnica |
|---|---|---|---|
| Supabase Auth e RLS | Não aplicável: a plataforma usa OAuth Manus e MySQL/TiDB. | Não substituir pela recomendação literalmente. | Manter autenticação provida; reforçar autorização no servidor e testes de isolamento. |
| Sessão e identidade | `protectedProcedure` exige identidade validada pelo SDK; o contexto de sessão vem do servidor. | Parcialmente demonstrado. | Confirmar capacidades de MFA, verificação de e-mail, revogação e rate limiting com o provedor antes de prometer esses controles. |
| RBAC | Papéis `owner`, `admin`, `analyst`, `reviewer` e `viewer` são lidos da associação de organização no servidor. | Implementado para equipe e revisão. | Criar matriz de permissões e testar cada procedimento mutável contra todos os papéis. |
| Isolamento por organização | Consultas do dashboard e mutações vinculadas filtram por `organizationId`; referências cruzadas passam por `assertEntityBelongsToOrganization`. | Implementado na camada de aplicação, sem defesa nativa equivalente a RLS. | Cobrir leitura, criação, alteração, exclusão e download entre tenants por testes negativos. |
| Convites | Token aleatório de 32 bytes, hash SHA-256 persistido, validade de 7 dias, uso único e vínculo com e-mail. | Implementado. | Adicionar evento auditável de criação, aceite, expiração e revogação. |
| Upload | MIME, extensão, tamanho e nome são validados; bytes são conferidos; a chave inclui organização e UUID. | Parcialmente implementado. | Acrescentar inspeção antivírus, limite de taxa, telemetria e política de quarentena conforme o risco do piloto. |
| Download de evidências | A interface usa `fileUrl`; o proxy de storage assina a chave recebida e redireciona sem autorização organizacional. | **P0: não adequado para documentos reais.** | Retirar URL persistida da resposta e criar procedimento protegido que valida a evidência, organização, papel e só então emite URL temporária. |
| Segredos | As credenciais de banco e storage aparecem apenas no servidor auditado; não foi encontrado uso de `service_role` ou segredo de storage no código de cliente revisado. | Bom sinal, porém não é prova do bundle nem da configuração do provedor. | Incluir varredura de CI para segredos e regras de acesso mínimo para ambiente e banco. |
| Logs de auditoria | Não há tabela ou procedimento de `audit_events` para ações de segurança e documentos. | **P0 para rastreabilidade empresarial.** | Criar eventos append-only com organização, ator, ação, recurso, instante, request ID e metadados minimizados. |
| Retenção, exclusão e direitos LGPD | Não há modelo nem procedimento de retenção/exclusão auditado. | **P0 de governança.** | Definir política por classe de dado, fluxo de solicitação e trilha de descarte/anonimização. |
| Backup e restauração | Não há automação ou evidência de teste de restauração no repositório. | Dependente de plataforma, mas **P0 operacional**. | Definir RPO/RTO, cobertura separada de banco e arquivos, responsável e teste documentado de restore. |
| Rate limiting e abuso | Não há middleware de limite de taxa auditado, inclusive no formulário público de piloto e nos endpoints de upload. | **P0 antes de exposição comercial ampla.** | Limitar IP e identidade, restringir tamanho de payload, registrar rejeições e alertar anomalias. |

## Evidências técnicas observadas

As evidências abaixo foram encontradas diretamente no projeto durante a revisão.

| Arquivo | Evidência |
|---|---|
| `server/routers.ts` | Procedimentos protegidos derivam organização no servidor, nunca a recebem como entrada do cliente. Mutações de evidência validam entidade vinculada, bytes e tipo antes do armazenamento. |
| `server/db.ts` | Dados do painel são lidos com filtro por `organizationId`; referências entre entidades e atribuições são verificadas dentro da organização. |
| `server/regularizando.policy.ts` | Regras de gerente de equipe, revisor e rejeição de referência cross-tenant estão centralizadas. |
| `server/_core/context.ts` | A identidade vem da autenticação de requisição do SDK, não de um papel informado pelo cliente. |
| `server/storage.ts` | Uploads usam URL pré-assinada solicitada somente pelo servidor e armazenam arquivo fora do banco, em chave segmentada por organização. |
| `server/_core/storageProxy.ts` | A emissão de URL de download não exige autenticação nem verifica propriedade da evidência; esse é o ponto crítico a corrigir. |

## Baseline P0 proposto antes de dados reais

> A liberação para dados reais deve ocorrer somente após evidência de cada controle, não apenas após a criação das telas correspondentes.

| Ordem | Controle | Critério de aceite verificável |
|---|---|---|
| 1 | Download privado de evidências | Chave de storage nunca aparece como link público reutilizável; cada download passa por tRPC protegido, resolve a evidência por ID e aplica organização/papel antes da URL temporária. |
| 2 | Testes negativos de isolamento | Usuário da organização A falha em leitura, criação de vínculos, alteração, revisão e download de qualquer recurso conhecido da organização B. |
| 3 | Matriz RBAC server-side | Testes cobrem todos os papéis e todos os procedimentos mutáveis; o cliente não decide permissões. |
| 4 | Audit log append-only | Ações de autenticação disponíveis, convite, upload, download, revisão, alteração de papel e exclusão geram evento consultável por organização. |
| 5 | Antifraude e limitação de abuso | Rotas públicas, autenticação e uploads têm limites por IP/usuário, payload máximo e registros de bloqueio. |
| 6 | Governança LGPD operacional | Aviso de privacidade, mapa de tratamento, retenção, exclusão, solicitação de titular, subprocessadores e procedimento de incidente são aprovados pelo controlador. |
| 7 | Backup e restauração | Banco e arquivos têm cobertura definida, RPO/RTO acordados e teste de restore documentado. |
| 8 | Gestão de segredos e provedor | Segredos ficam apenas em configuração protegida; não há credenciais administrativas no cliente; capacidades de MFA, e-mail e revogação são documentadas pelo provedor. |

## Decisão recomendada

A recomendação é **não substituir a arquitetura por Supabase apenas para obter RLS**. Isso ampliaria o escopo e não corrigiria, por si só, a exposição atual do download, a ausência de logs, backup ou governança LGPD. A fase seguinte deve começar pelo endpoint autorizado de download de evidências e pelos testes de isolamento de tenant. Em paralelo, a organização responsável pelo tratamento precisa definir os controles administrativos que não podem ser inferidos pelo código: finalidade, retenção, canal de titulares, incidentes, RPO/RTO e obrigações do provedor.

Esta avaliação não encontrou uma exploração comprovada de dados de outro tenant. Ela identifica, porém, controles ainda não demonstrados e uma rota de download que não satisfaz o padrão recomendado para documentos ambientais empresariais.
