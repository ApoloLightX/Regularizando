# Verificação de hardening — Regularizando

**Data de validação:** 14 de agosto de 2026.  
**Escopo:** piloto privado do Regularizando, com ênfase em isolamento multi-tenant, upload de evidências, autorização humana, integridade, limitação de taxa, fronteira para IA e governança LGPD.

## Critério de evidência

Este documento registra somente controles implementados no código e cobertos por testes. Ele não afirma certificação, varredura antimalware, teste de invasão, SLA, RPO/RTO, ISO 27001 ou SOC 2. A autorização de processamento de um documento não equivale a declaração de arquivo seguro.

| Camada | Controle implementado | Evidência de verificação |
| --- | --- | --- |
| Isolamento | Todas as consultas e vínculos de negócio exigem `organizationId`; referências de outro tenant são rejeitadas no servidor. | Regressões de escopo e caso adversarial de ID válido de outro tenant. |
| Upload | Allowlist, extensão, tamanho, bytes declarados, assinatura, CSV sem byte nulo e inspeção estrutural Office. | Casos adversariais para executável renomeado, MIME e magic bytes divergentes, DOCX truncado, XLSX corrompido, macro e ZIP bomb. |
| Quarentena | Evidência inicia em quarentena; não pode ser vinculada como comprovante, processada nem baixada sem as autorizações necessárias. | Testes de status e bloqueio de download. |
| Autorização | Revisor técnico, administrador ou proprietário podem autorizar; processamento e download são atos separados e auditados. | Regressões de papel, autorização dupla e eventos de auditoria. |
| Integridade | SHA-256 é coletado no upload e recalculado antes da autorização; divergência bloqueia o registro e exige novo upload. | Caso adversarial de divergência de hash e bloqueio de estado. |
| Rate limit | Buckets atômicos compartilhados por IP, usuário e organização, com `Retry-After`, auditoria e contingência por criticidade. | Regressões de arquitetura e casos adversariais de 429, upload, IA e indisponibilidade do banco. |
| IA | Conteúdo de documento é dado não confiável: não pode alterar permissões, usar ferramentas, autorizar download ou decidir obrigações. | Documento de fronteira e regressão contra injeção de prompt. |
| LGPD | Referência de titular é pseudonimizada por SHA-256; não há exclusão automática; decisões exigem papel autorizado e são auditadas. | Casos adversariais de criação, bloqueio de usuário comum e decisão auditada. |

## Estados de quarentena e liberação

O fluxo preserva os estados `quarantined_unscanned`, `validated`, `approved_for_processing` e `blocked`, além de estados de validação estrutural. A validação estrutural reduz vetores conhecidos de formato e compactação, mas **não substitui** antimalware, sandbox de execução ou perícia de conteúdo.

> A liberação para processamento não equivale a arquivo limpo. O download exige uma autorização humana adicional, após verificação de integridade e processamento previamente autorizado.

## Limites estruturais aplicados a Office

O contêiner Office é rejeitado quando está truncado ou incompatível, usa método de compactação não permitido, está criptografado, excede razão de compactação de 100:1, ultrapassa 64 MB declarados descompactados, contém mais de 3.000 entradas, inclui caminho inseguro, macro VBA ou relação externa. Relações comprimidas são infladas com limite explícito de saída para evitar crescimento descontrolado durante a inspeção.

## Contingência do rate limiter

Operações sensíveis — upload, IA/análise e funções administrativas — falham fechadas com erro de indisponibilidade temporária se o banco compartilhado de buckets não estiver disponível. Leituras tRPC públicas seguem a política fail-open definida, com registro técnico do erro; não existe fail-open global para ações sensíveis.

Os buckets expirados são removidos por um heartbeat autenticado a cada 15 minutos no endpoint `/api/scheduled/rate-limit-cleanup`. O job identifica-se por `task_uid` persistido no controle durável `rate-limit-cleanup`, preservando idempotência e evitando dependência de memória local.

## Resultados de validação

Na validação final, `pnpm check`, `pnpm test` e `pnpm build` foram concluídos com sucesso. A suíte contém **23 arquivos aprovados, 117 testes aprovados e 1 teste ignorado**. A nova suíte adversarial contém **16 cenários** e cobre isolamento, armazenamento, vetores de upload, integridade, rate limiting, fronteira de IA e LGPD.

O build exibiu dois avisos não bloqueantes: um asset de hero permanece resolvido em tempo de execução pelo storage gerenciado, e o bundle de cliente excede o limiar padrão de 500 kB após minificação. Nenhum desses avisos indica falha de compilação ou evidência de vulnerabilidade; a redução de bundle permanece uma otimização futura.

## Limitações residuais e revisão humana necessária

| Limitação | Risco residual | Alternativa recomendada |
| --- | --- | --- |
| Sem antimalware ou sandbox de arquivo declarados | Arquivos estruturalmente válidos ainda podem conter conteúdo malicioso desconhecido. | Integrar serviço de análise antimalware/sandbox, com contrato, privacidade e operação definidos antes de dados reais. |
| Sem certificações, pentest formal, SLA ou RPO/RTO | Não há evidência para prometer esses controles ao mercado. | Definir escopo, fornecedor, métricas e processo de evidência antes de qualquer afirmação pública. |
| Limites de estrutura ZIP não são análise semântica de documento | Conteúdo pode ser inadequado, enganoso ou não aplicável apesar do formato válido. | Manter revisão humana e, se houver IA futura, isolamento de instruções e fila de decisão. |
| Rotina de remoção não executa descarte de dados | Políticas LGPD não eliminam dados automaticamente. | Decisões de descarte devem ser revisadas e autorizadas por pessoas responsáveis. |

## Escopo futuro dependente de parceiro

O Nível A de validação técnica com fontes públicas está concluído. A validação com ativo real anonimizado e o piloto comercial com ativos reais dependem de organização parceira, autorização de tratamento e condições contratuais adequadas. A ausência desses dados não bloqueia o desenvolvimento atual e não foi compensada com documentos fictícios.
