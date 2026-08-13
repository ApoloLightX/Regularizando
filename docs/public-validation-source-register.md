# Registro de fontes públicas — validação técnica do Motor de Obrigações

**Classificação:** CASO PÚBLICO DE VALIDAÇÃO TÉCNICA.  
**Uso permitido:** desenvolvimento, QA, demonstração técnica interna e regressões.  
**Uso proibido:** identificar cliente, piloto contratado, ativo de organização ou evidência de cumprimento.

> Nenhum requisito deste registro é uma decisão técnica final. Toda aplicabilidade e toda decisão permanecem sujeitas à revisão humana.

## Escopo de cobertura

Este registro **não é um inventário integral de todas as condicionantes** das duas licenças. Ele preserva **trechos selecionados e verificados** para testar a cadeia de proveniência, extração, estruturação, requisito público e revisão humana. A LO nº 1660/2022 foi processada por texto nativo; a LO nº 1668/2024 foi processada por OCR e, por isso, cada achado dela exige conferência visual antes de qualquer decisão. O guia do IBAMA foi usado somente para confirmar que o comprovante de atendimento deve ser avaliado tecnicamente e não substitui o texto da licença.

| Fonte | Páginas | Método | Hash SHA-256 do arquivo consultado | Cobertura armazenada |
|---|---:|---|---|---|
| LO nº 1660/2022 | 3 | Texto nativo | `089084f858ae49fa10cb8cb1ef6f7a6058494349defdaeb79509a910589b0506` | 9 condicionantes selecionadas, com página e trecho original. |
| LO nº 1668/2024 | 7 | OCR em português | `c6e5d91edff4f44d665631e8183d510c3cdc9e22b275ec18dda37070aa4981f7` | 7 condicionantes selecionadas; todas marcadas como OCR sujeito a conferência visual. |
| Guia do IBAMA | Não aplicável | Texto público extraído | Não persistido como fixture de condicionantes | Referência conceitual do fluxo de atendimento e comprovação. |

## Fontes verificadas

| Identificador | Documento e emissor | Proveniência oficial | Informações comprovadas | Limites registrados |
|---|---|---|---|---|
| `public-ibama-lo-1660-2022` | Licença de Operação nº 1660/2022 — IBAMA | [PDF publicado pelo MDR](https://www.gov.br/mdr/pt-br/acesso-a-informacao/licitacoes-e-contratos/LICENCA_9124_2022_LO_NORTE.pdf) | Eixo Norte — Projeto São Francisco; processo nº 02001.003718/94-54; validade de 10 anos a partir da assinatura; emissão assinada em 12/12/2022. | A data inicial precisa ser preservada como data de assinatura; o documento não informa coordenadas no trecho analisado. |
| `public-ibama-lo-1668-2024` | Licença de Operação nº 1668/2024 — IBAMA | [PDF publicado pela ANTT](https://www.gov.br/antt/pt-br/assuntos/rodovias/concessionarias/lista-de-concessoes/ecovias-do-cerrado/documentos-de-gestao/licenciamento-ambiental/lo-no-1668-2024.pdf) | Concessionária Ecovias do Cerrado S.A.; processo nº 02001.034220/2019-71; validade de cinco anos a partir da assinatura; assinatura indicada em 27/12/2024. | Documento escaneado: os trechos abaixo foram obtidos por OCR e exigem conferência humana com a página visual antes de qualquer decisão. |
| `public-ibama-guia-condicionantes` | Atendimento de Condicionantes — IBAMA | [PDF do IBAMA](https://www.ibama.gov.br/images/laf/CONDICIONANTES.pdf) | O comprovante de atendimento é documento enviado para comprovar a condicionante e deve ser avaliado pela equipe técnica; o fluxo exige número e texto da condicionante. | Material é referência de fluxo, não substitui o texto de cada licença nem cria prazo, frequência ou evidência por inferência. |

## Trechos estruturáveis confirmados da LO nº 1660/2022

| Condicionante | Página do PDF | Texto original preservado | Prazo/frequência explícito | Evidência esperada inferível? | Estado de revisão |
|---|---:|---|---|---|---|
| 1.1 | 1 | “cópias das publicações deverão ser encaminhadas ao IBAMA, no prazo máximo de 30 (trinta) dias” | 30 dias após a comunicação via SISG-LAF | Cópias das publicações, pois são exigidas expressamente | Pendente de revisão técnica |
| 1.4 | 1 | “Os acidentes ambientais deverão ser comunicados [...] imediatamente após o ocorrido.” | Imediatamente após o ocorrido | Não identificada na fonte | Pendente de revisão técnica |
| 1.5 | 1 | “No prazo máximo de 30 (trinta) dias após a ocorrência do acidente ambiental, deverá ser protocolado o Relatório de Atendimento a Emergências Ambientais.” | 30 dias após o acidente | Relatório de Atendimento a Emergências Ambientais, expresso no texto | Pendente de revisão técnica |
| 1.8 | 2 | “A renovação desta Licença deverá ser requerida num prazo mínimo de 120 (cento e vinte) dias, antes do término da sua validade.” | Mínimo de 120 dias antes do término da validade | Não identificada na fonte | Pendente de revisão técnica |
| 2.1 | 2 | “Apresentar anualmente, até o mês de agosto do ano subsequente, relatório de execução dos programas e planos ambientais” | Anual; até agosto do ano subsequente | Relatório de execução, expresso no texto | Pendente de revisão técnica |
| 2.6 | 2 | “No prazo de dez meses a partir da publicação desta Licença de Operação” | 10 meses a partir da publicação | Não identificada na fonte | Pendente de revisão técnica |
| 2.18 | 3 | “Apresentar em até 180 dias readequação do Programa de Monitoramento de Vetores e Hospedeiros de Doenças” | Até 180 dias | Readequação do programa, expressa no texto | Pendente de revisão técnica |
| 2.33 | 3 | “Apresentar em 180 dias cronograma para conclusão da elaboração do Modelo Prognóstico de Qualidade de Água” | 180 dias | Cronograma, expresso no texto | Pendente de revisão técnica |
| 2.35 | 3 | “as referidas atualizações deverão ser apresentados em até 180 dias.” | Até 180 dias | Atualizações dos programas, planos e ações, conforme texto | Pendente de revisão técnica |

## Trechos estruturáveis confirmados por OCR da LO nº 1668/2024

| Condicionante | Página do PDF | Texto original preservado (OCR) | Prazo/frequência explícito | Evidência esperada inferível? | Estado de revisão |
|---|---:|---|---|---|---|
| 1.4 | 2 | “A renovação desta Licença deverá ser requerida num prazo mínimo de 120 (cento e vinte) dias, antes do término da sua validade.” | Mínimo de 120 dias antes do término da validade | Não identificada na fonte | Pendente de revisão técnica |
| 2.1 | 2 | “Executar, em até 90 (noventa) dias após a emissão da licença ambiental, os Programas Ambientais abaixo relacionados” | Até 90 dias após a emissão | Execução dos programas, mas o documento não identifica um comprovante específico | Pendente de revisão técnica |
| 2.2.b | 3 | “recuperar gradualmente os pontos de erosão no prazo de 3 (três) anos, apresentando os resultados intermediários nos relatórios anuais” | 3 anos; relatórios anuais intermediários | Resultados intermediários em relatórios anuais, expressos no texto | Pendente de revisão técnica |
| 2.3.b | 3 | “recuperar [...] no prazo de 2 (dois) anos, apresentando o resultado intermediário no primeiro relatório anual” | 2 anos; primeiro relatório anual | Resultado intermediário no primeiro relatório anual, expresso no texto | Pendente de revisão técnica |
| 2.4.b | 3 | “Submeter, no prazo de 270 dias, os gráficos e o banco de dados, com informações georreferenciadas” | 270 dias | Gráficos e banco de dados, expressos no texto | Pendente de revisão técnica |
| 2.12 | 6 | “Elaborar e apresentar, em até 60 (sessenta) dias após a emissão da licença ambiental, o Programa de Remoção e Realocação de População (PRRP)” | Até 60 dias após a emissão | PRRP, expresso no texto | Pendente de revisão técnica |
| 2.15 | 7 | “até o dia 30 de janeiro de cada ano, o relatório consolidado de acompanhamento” | Anual, até 30 de janeiro | Relatório consolidado, expresso no texto | Pendente de revisão técnica |

## Regras de tratamento

1. Campos não presentes na fonte devem permanecer `null`, `não informado`, `não identificado na fonte` ou `Aplicabilidade pendente de revisão técnica`, conforme sua natureza.
2. A fonte conserva URL oficial, página, trecho original e data de consulta/importação.
3. Casos públicos não podem ser associados a uma organização privada, a evidências de clientes ou a material comercial.
4. Não usar condição textual como decisão: ela deve passar por requisito versionado, revisão de aplicabilidade e decisão humana.

## Referências

[1] [Licença de Operação nº 1660/2022 — PDF oficial publicado pelo MDR](https://www.gov.br/mdr/pt-br/acesso-a-informacao/licitacoes-e-contratos/LICENCA_9124_2022_LO_NORTE.pdf)

[2] [Licença de Operação nº 1668/2024 — PDF oficial publicado pela ANTT](https://www.gov.br/antt/pt-br/assuntos/rodovias/concessionarias/lista-de-concessoes/ecovias-do-cerrado/documentos-de-gestao/licenciamento-ambiental/lo-no-1668-2024.pdf)

[3] [Atendimento de Condicionantes — IBAMA](https://www.ibama.gov.br/images/laf/CONDICIONANTES.pdf)
