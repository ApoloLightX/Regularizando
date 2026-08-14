# Motor de obrigações verificáveis

## Princípio operacional

O motor não interpreta uma norma de forma autônoma nem declara que uma obrigação é aplicável sem revisão técnica. Ele armazena uma cadeia verificável: **fonte oficial → requisito versionado → regra de aplicabilidade → obrigação instanciada → evidência → revisão humana → decisão**.

Uma fonte normativa precisa registrar URL, emissor, identificador, publicação, vigência conhecida, trecho de origem e status de revisão. Um requisito só pode ficar `verificado` após um usuário autorizado registrar a versão e a referência de origem. Requisitos `rascunho` ou `em_revisao` nunca geram uma conclusão de conformidade; podem, no máximo, produzir uma pendência de validação técnica.

## Fontes iniciais elegíveis

O catálogo não será pré-preenchido com obrigações genéricas para clientes. Para organizações, a equipe cadastra documentos autorizados e contextualizados, com revisão humana. Em paralelo, o Nível A usa um domínio global segregado de validação pública (`publicValidationCases`, fontes, achados e requisitos públicos) para demonstrar extração e rastreabilidade sem criar obrigação de cliente. Essa validação pública está concluída e não substitui a confirmação de aplicabilidade de uma organização futura. As primeiras fontes oficiais elegíveis são organizadas abaixo.

| Fonte | Papel no motor | Limite de uso |
|---|---|---|
| Lei nº 15.190/2025, Planalto | Base federal de conceitos, fases e condicionantes do licenciamento ambiental. [1] | Não substitui regra de órgão licenciador competente nem dispensa a leitura do ato aplicável. |
| Atos normativos do CONAMA | Catálogo oficial de atos, com status e documentação vinculada. [2] | A aplicabilidade depende de matéria, vigência, localidade, tipologia e situação concreta. |
| Licenciamento Ambiental Federal — Ibama | Referência para procedimentos, legislação, orientações e sistemas do âmbito federal. [3] | Não deve ser usado para inferir competência federal em caso concreto. |
| Licença, condicionante, termo de referência e ofício do órgão competente | Fonte operacional prioritária da organização para uma obrigação concreta. | Exige vínculo ao ativo, contexto e revisor técnico responsável. |

## Modelo de dados proposto

| Entidade | Responsabilidade | Campo de rastreabilidade obrigatório |
|---|---|---|
| `requirement_sources` | Armazena a fonte primária ou documento aplicável. | Emissor, URL/arquivo, identificador, publicação, vigência, status de verificação. |
| `sector_profiles` | Define o vocabulário e o escopo de trabalho de cada setor. | Setor, versão, status e escopo declarado; não contém parecer jurídico autônomo. |
| `requirements` | Identidade estável do requisito. | Fonte principal e perfil setorial associado. |
| `requirement_versions` | Texto e parâmetros de uma versão revisada do requisito. | Versão, trecho-fonte, vigência, status de revisão e revisor. |
| `obligation_instances` | Aplicação de uma versão a um site, licença ou organização. | Organização, requisito-versão, escopo, prazo, responsável e estado. |
| `obligation_evidence_links` | Vincula evidências existentes à obrigação. | Obrigação, evidência, papel da evidência e usuário que fez o vínculo. |
| `obligation_decisions` | Mantém a decisão humana sobre cumprimento. | Decisor, decisão, justificativa, referência da versão e instante. |

## Guardrails contra conclusões não fundamentadas

> O sistema não apresenta “conforme”, “não conforme”, prazo legal, obrigação aplicável ou recomendação técnica sem fonte, versão e revisão humana registradas.

As APIs devem rejeitar: criação de requisito sem fonte; publicação de versão sem trecho de origem ou revisor; aplicação de requisito fora do setor/escopo declarado sem justificativa; decisão sem vínculo a uma versão verificada; e acesso a registros de outra organização. Perfis de telecom, infraestrutura, indústria, consultoria e outros funcionam como **filtros de contexto e vocabulário**, não como um modelo que “sabe a lei” sem referência documental.

O fluxo de análise deve sempre devolver quatro sinais estruturados: `status_da_base` (`verificada`, `em_revisao` ou `incompleta`), `fontes`, `limites_de_escopo` e `requer_revisao_humana`. Se a base não estiver verificada, o único resultado permitido é uma solicitação de fonte ou revisão.

## Recorte inicial do piloto

O primeiro recorte é telecom e infraestrutura distribuída, sem criar um conjunto artificial de obrigações. A validação técnica pública já confirma a cadeia documental e os controles do motor; uma futura organização parceira poderá cadastrar fonte documental autorizada — por exemplo, licença ou condicionante de site aprovado — para que o revisor transforme apenas esse conteúdo em uma versão organizacional de requisito. A aplicação da obrigação exige seleção explícita de organização, ativo ou licença, prazo e responsável. Essa fase é futura e não bloqueia a entrega atual.

## Referências

[1] [Lei nº 15.190, de 8 de agosto de 2025 — Planalto](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15190.htm)  
[2] [Atos Normativos — CONAMA](https://conama.mma.gov.br/atos-normativos-sistema)  
[3] [Licenciamento Ambiental Federal — Ibama](https://www.gov.br/ibama/pt-br/assuntos/laf)
