# Release Candidate pré-piloto — Regularizando

**Data:** 15 de agosto de 2026.  
**Escopo:** consolidação pré-piloto, sem dados privados de clientes e sem ampliação de módulos de IA.  
**Responsável atual do projeto e controlador provisório do site:** Gabriel Apolo Leal Rocha, pessoa física responsável pelo Regularizando.

## Síntese executiva

Esta Release Candidate consolida a plataforma como uma base verificável de **Licenciamento & Obrigações** para demonstração e preparação de piloto privado. A RC adiciona Aviso de Privacidade operacional, canal público de direitos, consentimento versionado, estados e trilha operacional de pedidos LGPD, demonstração coerente em Portfólio Telecom · SP e regressões adicionais para autorização, URL temporária e continuidade.

O escopo não declara certificações, antimalware, sandbox, pentest, SLA, RPO/RTO, expiração configurável de URL, backup restaurado ou disponibilidade enterprise. A validação com documentos e ativos de parceiro continua formalmente separada como etapa futura.

## Maturidade e prontidão

| Escopo | Estado | Evidência | Limite |
| --- | --- | --- | --- |
| Desenvolvimento | **Pronto na RC** | Typecheck, build e 125 testes aprovados, com 1 ignorado. | Não equivale a produção enterprise. |
| Demonstração | **Pronto com prévias ilustrativas** | Home usa Portfólio Telecom · SP e informa que não há dados de cliente. | A métrica 18/25 é ilustrativa; não é benchmark real. |
| Piloto privado | **Pronto condicionalmente** | Privacidade, isolamento, RBAC, quarentena, auditoria e checklist contratual existentes. | Exige organização parceira, contrato, DPA, aceite de retenção e controles externos de identidade/continuidade. |
| Produção enterprise | **Não declarada como pronta** | Não há evidência de controles externos e operacionais necessários. | Requer revisão jurídica, restore testado, requisitos do provedor e controles comerciais formais. |

## Entregas incluídas nesta RC

| Área | Entrega | Estado |
| --- | --- | --- |
| Aviso público | Rota `/aviso-de-privacidade`, metadata canônico e link nos rodapés públicos. | Implementado. |
| Canal LGPD | Formulário `/contato` permite selecionar **Privacidade e dados pessoais / LGPD**, tipo de pedido e contexto. | Implementado. |
| Consentimento | Todo contato armazena a versão do Aviso de Privacidade e o momento de manifestação. | Implementado. |
| Finalidades | Piloto, direitos de titulares, operação organizacional e segurança foram mapeados; bases legais finais estão marcadas para revisão jurídica. | Implementado com limite explícito. |
| Governança LGPD | Abertura, atribuição, análise, decisão, execução, encerramento, eventos e auditoria; exclusão não ocorre automaticamente. | Implementado. |
| Demonstração | Portfólio Telecom · SP, métrica ilustrativa de 18/25 e rótulo sem dados de cliente. | Implementado. |
| Segurança | Regressões de rate limit, RBAC, quarentena, SHA-256, URL temporária, IA não confiável e continuidade documentada. | Implementado/testado dentro da arquitetura atual. |

## Arquitetura e migração

A aplicação permanece em React, Vite, Express, tRPC, Drizzle, MySQL/TiDB, OAuth Manus e armazenamento gerenciado. As operações privadas usam contexto de organização, papéis e trilhas de auditoria. Evidências de organizações ficam em chave protegida e só recebem URL temporária depois de autorização separada de processamento e download.

A migração `0020_large_greymalkin` amplia `dataSubjectRequests` com responsável, marcos de execução e encerramento; amplia eventos LGPD; e acrescenta categoria, tipo de pedido e versão do aviso às solicitações públicas. Ela torna `company` opcional somente para acomodar pedidos de privacidade que não são leads comerciais. Nenhuma coluna ou tabela foi removida.

## Testes e validações

| Verificação | Resultado |
| --- | --- |
| `pnpm check` | Aprovado. |
| `pnpm test` | 25 arquivos aprovados; **125 testes aprovados e 1 ignorado**. |
| `pnpm build` | Aprovado para cliente, SSR e servidor. |
| Auditoria de diff | Sem erros de formatação, arquivos `.env`, chaves, logs ou padrões de segredo no diff e nos arquivos novos. |
| Journal de migração | Entrada `0020_large_greymalkin` presente. |
| Rota pública | `/aviso-de-privacidade` respondeu HTTP 200 e expôs o conteúdo previsto no ambiente de desenvolvimento. |

O build mantém dois avisos não bloqueantes: asset de hero resolvido em execução pelo storage gerenciado e bundle cliente acima do limiar padrão de 500 kB. A captura visual automatizada falhou por indisponibilidade do subsistema de navegador, apesar de a rota responder com HTTP 200 e as regressões estruturais de acessibilidade passarem. A conferência visual manual em desktop e mobile é, portanto, uma pendência de validação operacional antes de apresentação externa.

## Limitações e riscos residuais

| Limitação | Risco | Encaminhamento |
| --- | --- | --- |
| Sem antimalware ou sandbox declarados | Arquivo estruturalmente válido pode conter ameaça desconhecida. | Integrar solução adequada antes de dados reais. |
| TTL da URL temporária não configurado no código | Não há prova local de tempo de expiração. | Validar configuração do provedor e testar expiração. |
| Sem restore independente | Não se pode alegar recuperabilidade, RPO ou RTO. | Executar restore com evidência e responsável. |
| Identidade depende do provedor OAuth | MFA e verificação de e-mail não foram comprovados pelo projeto. | Confirmar com o provedor e documentar decisão do controlador. |
| Aviso e bases legais | Aviso operacional não substitui avaliação jurídica. | Revisão jurídica antes de clientes, contrato ou dados reais. |

## Dependências externas e próxima fase

Domínio próprio, retirada da marca da plataforma, identidade visual Rastro, CNPJ/estrutura societária, encarregado/DPO, contratos, DPA, teste de restore, requisitos do provedor e ativo parceiro permanecem fora desta RC. A validação pública com fontes oficiais não depende desses itens; ativo real anonimizado e piloto comercial dependem de futuro parceiro autorizado.

## Referências

[1] [Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)  
[2] [Baseline operacional de segurança do piloto](./pilot-security-operating-baseline.md)  
[3] [Baseline operacional de privacidade e retenção](./privacy-operational-baseline.md)  
[4] [Verificação de hardening](./security-hardening-verification.md)
