# Validação inicial de fontes oficiais para o motor de obrigações

> **Status:** catálogo de fontes prioritárias confirmado em 12 de agosto de 2026. Este documento não cria obrigações aplicáveis nem substitui a revisão técnica da organização.

| Fonte | Emissor e URL oficial | Uso permitido no motor | Observação de controle |
|---|---|---|---|
| Lei nº 15.190/2025 | Presidência da República — Planalto | Contexto geral de licenciamento, tipos de licença e condicionantes. | Manter o texto consolidado, vetos e promulgações associados à versão usada. |
| LC nº 140/2011 | Presidência da República — Planalto | Critérios de competência federativa e definição da autoridade licenciadora. | A competência concreta continua pendente até município, UF, tipologia e processo serem conhecidos. |
| Lei nº 13.116/2015 e Decreto nº 10.480/2020 | Presidência da República — Planalto | Contexto de infraestrutura de telecomunicações, direito de passagem e licenças urbanas. | Não inferir dispensa ambiental; associar sempre ao ativo e à norma ambiental/local aplicável. |
| Lei nº 9.509/1997, Decreto nº 47.400/2002 e Decreto nº 69.120/2024 | Estado de São Paulo — ALESP | Base paulista de licenciamento, vigência e modalidades. | Registrar a redação consolidada e a relação entre as normas antes de gerar requisito. |
| DN CONSEMA nº 01/2024 e lista de municípios | SEMIL/CONSEMA | Verificação de aptidão municipal para licenciamento local. | Consultar a lista oficial vigente no momento de cada análise; não deduzir competência só pelo município. |
| CETESB — Licenciamento Ambiental | CETESB | Fonte operacional para fluxos, documentos e consulta de processo. | Tratar como orientação operacional, não como substituta da norma ou da licença específica. |
| Lei nº 12.651/2012 e Lei nº 11.428/2006 | Presidência da República — Planalto | Triagem condicionada de APP, vegetação nativa e Mata Atlântica. | Só ativar após localização, coordenadas e confirmação técnica do recorte ambiental. |
| Decreto nº 6.660/2008 | Presidência da República — Planalto | Regulamentação complementar da proteção da Mata Atlântica. | Usar apenas quando o ativo ou a intervenção tiver recorte de vegetação nativa confirmado tecnicamente. |
| Resolução CONAMA nº 237/1997 | CONAMA/MMA | Histórico procedimental e conceitos de LP, LI, LO, etapas e anexos de atividades. | Avaliar compatibilidade concreta com a Lei nº 15.190/2025 e a competência definida pela LC nº 140/2011 antes de aplicá-la. |
| Resoluções CONAMA nº 357/2005 e nº 430/2011 | CONAMA/MMA | Referências condicionais para qualidade da água e lançamento de efluentes. | Manter desativadas até que o caso apresente água, efluente, corpo receptor ou condicionante pertinente; a Resolução nº 430 estava sob processo público de atualização em 2025. |

## Regras confirmadas para a ingestão

1. Cadastrar uma fonte com URL oficial, órgão emissor, jurisdição, identificador, data de publicação e vigência conhecida.
2. Manter cada requisito em versão própria, com artigo, item ou página e transcrição literal do trecho de origem.
3. Gerar obrigação somente após revisão humana e confirmação de aplicabilidade ao ativo; ausência de dados deve resultar em `Aplicabilidade pendente de revisão técnica`.
4. Guardar conflitos como conflito explícito entre fontes, com hierarquia e vigência, sem selecionar uma regra silenciosamente.
5. Não cadastrar obrigação, prazo, responsável ou evidência esperada a partir da norma geral sem documento real do empreendimento.

## Fontes oficiais verificadas

- https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15190.htm
- https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp140.htm
- https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13116.htm
- https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/decreto/d10480.htm
- https://www.al.sp.gov.br/repositorio/legislacao/lei/1997/lei-9509-20.03.1997.html
- https://www.al.sp.gov.br/repositorio/legislacao/decreto/2002/decreto-47400-04.12.2002.html
- https://www.al.sp.gov.br/repositorio/legislacao/decreto/2024/decreto-69120-09.12.2024.html
- https://semil.sp.gov.br/consema/licenciamento-ambiental-municipal/
- https://www.cetesb.sp.gov.br/cetesb/licenciamento_ambiental
- https://licenciamento.cetesb.sp.gov.br/cetesb/fases.asp
- https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm
- https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11428.htm
- https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/decreto/d6660.htm
- https://conama.mma.gov.br/?option=com_sisconama&task=arquivo.download&id=237
- https://conama.mma.gov.br/atos-normativos-sistema
- https://www.gov.br/participamaisbrasil/consulta-publica-sobre-alteracao-da-resolucao-conama-n-430-de-13-de-maio-de-2011drenagem-urbana-e-parametros-para-lancamento-de-efluentes
