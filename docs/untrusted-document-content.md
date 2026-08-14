# Documentos enviados: fronteira de conteúdo não confiável

## Regra operacional

Todo arquivo enviado por uma organização é tratado como **conteúdo não confiável**. A validação de extensão, assinatura, tamanho, estrutura e integridade não altera essa classificação e não representa varredura antimalware, declaração de arquivo limpo ou garantia de segurança do conteúdo.

## Limites para integrações futuras de IA

Qualquer integração futura de IA deve receber o conteúdo de evidência apenas como dado para análise supervisionada. O texto, metadados, nomes de arquivos, comentários, links e instruções presentes em documentos nunca podem alterar permissões, executar ferramentas, criar obrigações, mudar decisões de revisão, autorizar processamento, emitir download ou substituir a decisão humana.

As saídas de IA devem preservar fonte, escopo, confiança e limitação. Elas devem ser apresentadas como subsídio para revisão técnica humana e não como interpretação jurídica, decisão regulatória ou comprovação de conformidade.

## Controles implementados

| Controle | Estado | Limite explícito |
|---|---|---|
| Upload privado em quarentena | Implementado | O documento não fica disponível automaticamente. |
| Validação estrutural | Implementado | Não substitui antivírus nem análise de malware. |
| SHA-256 de integridade no upload | Implementado | Não atesta conteúdo seguro. |
| Revisão humana | Implementado | Revisão não equivale a autorização de processamento ou download. |
| Autorizações separadas | Implementado | Processamento e download exigem autorização humana explícita. |
| IA sobre documentos | Planejado | Exige isolamento de instruções, ausência de privilégios e revisão humana. |

## Regras de implementação

1. Não utilizar conteúdo de documento como prompt de sistema, configuração, instrução de ferramenta ou entrada de autorização.
2. Não permitir que um resultado de IA chame procedimentos administrativos ou de mutação sem ação humana explícita no produto.
3. Exigir escopo organizacional, fonte identificável e trilha de auditoria para qualquer análise futura associada a uma evidência.
4. Não registrar o conteúdo bruto de arquivos, tokens, chaves ou PII desnecessária na réplica externa de governança.
