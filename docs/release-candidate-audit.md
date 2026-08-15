# Auditoria de maturidade — Release Candidate pré-piloto

**Data da auditoria:** 15 de agosto de 2026.  
**Referência de código:** checkpoint `c97c55b8`.  
**Método:** revisão do schema, rotas, controles de segurança, páginas públicas, documentação e validação local de tipos e regressões.

## Decisão de escopo

Esta Release Candidate consolida o núcleo de **Licenciamento & Obrigações**, segurança documental, isolamento entre organizações, governança LGPD, rastreabilidade e prova técnica pública. Ela não adiciona módulos de IA, não inventa dados de cliente e não trata a ausência de documentos privados como bloqueio técnico.

## Maturidade por nível de validação

| Nível | Estado | Escopo | Limite explícito |
| --- | --- | --- | --- |
| **A — Validação técnica pública** | **Concluível agora** | Fontes oficiais, casos públicos, proveniência, revisão humana, testes de regressão e isolamento dos casos públicos. | Não representa cliente, parceiro ou piloto contratado. |
| **B — Ativo real ou anonimizado** | **Aguardando futuro parceiro** | Validação com documentos e contexto autorizados por uma organização. | Não é bloqueio técnico da RC e não será preenchido com dados simulados. |
| **C — Piloto comercial** | **Futuro** | Organização parceira, contrato, DPA, escopo, dados autorizados e governança operacional. | Depende de parceiro e de condições contratuais. |

## Controles implementados e testados

| Área | Evidência no produto | Estado na RC |
| --- | --- | --- |
| Motor de Obrigações | Fonte, versão, aplicabilidade, prazo, responsável, evidência, revisão e decisão preservados por organização. | Implementado e testado. |
| Isolamento multi-tenant e RBAC | `organizationId` obrigatório nas operações de negócio; testes negativos para leitura, vínculo, revisão e download entre organizações. | Implementado e testado. |
| Upload e quarentena | Allowlist, assinatura, tamanho, estrutura Office, macro, caminho interno, ZIP bomb, SHA-256 e autorizações humanas separadas. | Implementado e testado. |
| Download controlado | URL temporária somente após autorização de processamento, autorização de download, integridade e escopo organizacional. | Implementado e testado. |
| Rate limiting | Buckets atômicos por IP, usuário e organização, `Retry-After`, 429, auditoria e política de contingência por criticidade. | Implementado e testado. |
| Conteúdo documental não confiável | Documentos são dados não confiáveis; não podem acionar ferramentas, mudar permissões ou decidir conformidade. | Implementado e testado como fronteira arquitetural. |
| Casos públicos | Casos oficiais segregados de organizações privadas, com fonte, hash, trecho e revisão. | Implementado e testado. |
| Trust Center | Estados **Implementado**, **Em validação** e **Planejado**, sem declarar certificações ou controles inexistentes. | Implementado e testado. |

## Itens parcialmente implementados a concluir nesta RC

| Item | Estado observado | Fechamento previsto |
| --- | --- | --- |
| Aviso de Privacidade público | O formulário informa finalidade e recolhe consentimento, mas ainda não possui aviso visível e versionado. | Publicar aviso operacional, apresentar controlador provisório e canal de direitos no próprio formulário. |
| Governança LGPD operacional | Políticas versionadas, pedidos pseudonimizados, eventos e decisão humana existem. Os estados e marcos ainda precisam ser harmonizados com abertura, análise, execução e encerramento solicitados. | Ajustar modelo, interface e testes sem excluir dados automaticamente. |
| Baseline de retenção | A organização pode manter políticas por categoria e versão; o baseline formal da plataforma ainda não está distinguido publicamente da configuração contratual futura. | Documentar os dois níveis e manter descarte sob revisão humana. |
| Demonstração da Home | A métrica já explica critério, mas ainda mistura “Centro logístico” e “torre 18”. | Consolidar a narrativa em Portfólio Telecom · SP e tornar 72% também legível como fração ilustrativa. |
| Matriz adversarial ampliada | Há 16 cenários adversariais; a RC ainda revisará a cobertura de URL expirada, autenticação abusiva e trilha de auditoria. | Complementar somente os cenários que possam ser exercitados pela arquitetura atual. |

## Dependências que não bloqueiam a RC

| Classificação | Dependência | Tratamento na RC |
| --- | --- | --- |
| Externa/comercial | `regularizando.com`, DNS, SSL no domínio definitivo e retirada da identificação da plataforma. | Não alterar DNS sem autorização; documentar como pré-requisito de apresentação comercial definitiva. |
| Revisão jurídica humana | Bases legais definitivas, retenção contratual, aviso final e instrumentos com cliente. | Publicar somente aviso operacional transparente, marcado para revisão jurídica antes de produção com clientes. |
| Continuidade | Teste de restauração independente do provedor gerenciado. | Não alegar backup validado, RPO ou RTO sem evidência operacional. |
| Futuro parceiro | Ativo real anonimizado, documentos privados e piloto comercial. | Manter nos níveis B/C, sem dados fictícios. |
| Próxima fase | Nova identidade visual, domínio, benchmark e integração multi-provider de IA, material comercial e prospecção. | Não incluir nesta RC. |

## Critério de fechamento

A RC será considerada pronta para publicação quando as lacunas resolvíveis acima estiverem implementadas, migradas quando necessário, testadas, documentadas e revisadas contra segredos, dados privados, logs e artefatos indevidos. A classificação de **pronto para produção enterprise** permanecerá negativa enquanto controles relevantes dependerem de revisão jurídica, recursos externos ou validação operacional independente.

## Verificação pública em desenvolvimento

Em 15 de agosto de 2026, as rotas `/aviso-de-privacidade` e `/contato` foram abertas no ambiente de desenvolvimento. O Aviso exibiu controlador provisório, versão, limitação de revisão jurídica, canal de privacidade, finalidades, limites de retenção e a referência à LGPD. A página de contato carregou sem erro; a seleção do canal e o vínculo com o aviso permanecem cobertos por regressões estruturais, além da validação visual final antes da publicação.
