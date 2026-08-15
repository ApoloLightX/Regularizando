# Baseline operacional de privacidade e retenção

**Versão:** 2026-08-15.  
**Controlador provisório do site:** Gabriel Apolo Leal Rocha, pessoa física responsável pelo projeto Regularizando.  
**Status:** operacional para a Release Candidate; **revisão jurídica humana obrigatória antes de clientes, contratos ou dados reais de parceiros**.

## Objetivo e fronteira

O baseline estabelece controles mínimos de governança no produto. Ele não cria uma tabela nacional de prazos, não define unilateralmente a base legal de cada contrato e não executa eliminação automática. A política de cada organização poderá complementar esses controles depois de análise jurídica, contratual e operacional.

> A LGPD exige transparência sobre finalidade, forma e duração do tratamento, identificação e contato do controlador, compartilhamento e direitos dos titulares. Ela também exige finalidade, necessidade, transparência, segurança e prestação de contas no tratamento de dados pessoais. [1]

## Dois níveis de política

| Nível | Quem define | O que contém | Limite atual |
| --- | --- | --- | --- |
| **Baseline da plataforma** | Regularizando | Minimização, controle de acesso, isolamento de organizações, trilha de auditoria, retenção versionada e revisão humana para descarte. | Não determina prazo legal específico, não promete RPO/RTO e não substitui análise jurídica. |
| **Política da organização** | Administradores autorizados, sob governança contratual futura | Categoria, prazo, justificativa, método de descarte, responsável, aprovação e histórico de versões. | Uma política ativa não apaga dados automaticamente. |

## Finalidades atualmente mapeadas

| Finalidade | Dados mínimos | Base legal | Estado |
| --- | --- | --- | --- |
| Avaliar um pedido de piloto e responder ao contato | Nome, e-mail, empresa, função, setor, escala e contexto fornecidos. | **Sujeita à revisão jurídica antes de produção com clientes.** | Operacional no formulário público. |
| Receber pedido de privacidade | Nome, e-mail, tipo de solicitação e contexto. | **Sujeita à revisão jurídica antes de produção com clientes.** | Operacional no canal público. |
| Operar o workspace de organização | Dados de identidade, papéis, dados de negócio e metadados necessários ao fluxo autorizado. | **Sujeita à revisão jurídica e contratual antes de produção com clientes.** | Estrutura técnica implementada; sem dados fictícios. |
| Proteger o serviço e investigar eventos sensíveis | Metadados minimizados de auditoria, segurança e governança. | **Sujeita à revisão jurídica antes de produção com clientes.** | Controle técnico implementado. |

O checkbox do formulário registra manifestação para a finalidade explícita apresentada. Ele **não** é usado como justificativa universal para qualquer tratamento futuro, compartilhamento ou retenção.

## Tratamento de solicitações de titulares

O canal público fica no formulário de contato, na categoria **“Privacidade e dados pessoais / LGPD”**. Ele aceita acesso, confirmação de tratamento, correção, exportação, exclusão, anonimização, oposição e dúvidas. O identificador do titular é minimizado e os pedidos internos usam referência pseudonimizada por SHA-256.

| Etapa | Controle atual |
| --- | --- |
| Abertura | Registro de tipo, contexto, referência pseudonimizada e auditoria. |
| Atribuição | Gestor autorizado atribui membro da organização; a atribuição gera evento. |
| Análise e decisão | Estados explícitos, justificativa e ator responsável. |
| Execução | Exige nota descritiva antes de o estado ser marcado como executado. |
| Encerramento | Registrado como etapa própria, preservando a trilha de eventos. |
| Exclusão ou anonimização | Nunca ocorre automaticamente por abertura de pedido ou ativação de política. |

## Limites e próximos responsáveis

Não há declaração de encarregado/DPO, CNPJ, endereço comercial, certificação, SLA, RPO/RTO, varredura antimalware ou política contratual de subprocessadores. Esses itens dependem de constituição, contrato, infraestrutura e/ou revisão profissional posterior. O Aviso de Privacidade deverá ser atualizado quando o controlador passar a ser pessoa jurídica ou quando houver mudança material de finalidade, canal ou subprocessadores.

## Referências

[1] [Lei nº 13.709/2018 — LGPD, arts. 6º, 8º, 9º e 18](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
