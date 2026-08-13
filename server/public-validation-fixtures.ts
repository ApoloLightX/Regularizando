export const PUBLIC_VALIDATION_CASE = {
  slug: "ibama-licencas-operacao-validacao-tecnica",
  title: "Licenças de Operação IBAMA — validação técnica pública",
  purpose: "Caso público de validação técnica com documentos oficiais. Não representa cliente, organização privada, ativo real de cliente, evidência de cumprimento ou piloto contratado.",
} as const;

export const PUBLIC_VALIDATION_FIXTURES = [
  {
    slug: "public-ibama-lo-1660-2022",
    title: "Licença de Operação nº 1660/2022 — Eixo Norte — Projeto São Francisco",
    issuer: "Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis — IBAMA",
    documentType: "licenca_operacao" as const,
    identifier: "LO nº 1660/2022",
    jurisdiction: "Federal",
    sourceUrl: "https://www.gov.br/mdr/pt-br/acesso-a-informacao/licitacoes-e-contratos/LICENCA_9124_2022_LO_NORTE.pdf",
    sourceHash: "089084f858ae49fa10cb8cb1ef6f7a6058494349defdaeb79509a910589b0506",
    publicationDate: new Date("2022-12-12T14:06:55.000Z"),
    effectiveFrom: new Date("2022-12-12T14:06:55.000Z"),
    effectiveTo: null,
    extractionMethod: "texto_nativo" as const,
    sourceQualityStatus: "verificada" as const,
    extractionConfidence: "texto_verificado" as const,
    locators: { "1.1": "página 1", "1.4": "página 1", "1.5": "página 1", "1.8": "página 2", "2.1": "página 2", "2.6": "página 2", "2.18": "página 3", "2.33": "página 3", "2.35": "página 3" },
    documentText: `1.1. Esta Licença deverá ser publicada em conformidade com a Resolução nº 006/86 do Conselho Nacional do Meio Ambiente – CONAMA, sendo que cópias das publicações deverão ser encaminhadas ao IBAMA, no prazo máximo de 30 (trinta) dias, após a comunicação ao empreendedor, via SISG-LAF, sobre a concessão da licença.
1.4. Os acidentes ambientais deverão ser comunicados via Sistema Nacional de Emergências Ambientais - SIEMA, imediatamente após o ocorrido.
1.5. No prazo máximo de 30 (trinta) dias após a ocorrência do acidente ambiental, deverá ser protocolado o Relatório de Atendimento a Emergências Ambientais.
1.8. A renovação desta Licença deverá ser requerida num prazo mínimo de 120 (cento e vinte) dias, antes do término da sua validade.
2.1. Apresentar anualmente, até o mês de agosto do ano subsequente, relatório de execução dos programas e planos ambientais, incluindo as medidas de controle ambiental, conforme aprovação do Ibama.
2.6. No prazo de dez meses a partir da publicação desta Licença de Operação, que seja realizada a convalidação e avaliação do cumprimento dos Programas previstos e executados nas Comunidades Indígenas impactadas pelo empreendimento.
2.18. Apresentar em até 180 dias readequação do Programa de Monitoramento de Vetores e Hospedeiros de Doenças.
2.33. Apresentar em 180 dias cronograma para conclusão da elaboração do Modelo Prognóstico de Qualidade de Água.
2.35. Para os programas, planos e ações que necessitam de atualização para a fase de operação, as referidas atualizações deverão ser apresentados em até 180 dias.`,
  },
  {
    slug: "public-ibama-lo-1668-2024",
    title: "Licença de Operação nº 1668/2024 — Ecovias do Cerrado",
    issuer: "Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis — IBAMA",
    documentType: "licenca_operacao" as const,
    identifier: "LO nº 1668/2024",
    jurisdiction: "Federal",
    sourceUrl: "https://www.gov.br/antt/pt-br/assuntos/rodovias/concessionarias/lista-de-concessoes/ecovias-do-cerrado/documentos-de-gestao/licenciamento-ambiental/lo-no-1668-2024.pdf",
    sourceHash: "c6e5d91edff4f44d665631e8183d510c3cdc9e22b275ec18dda37070aa4981f7",
    publicationDate: new Date("2024-12-27T20:39:00.000Z"),
    effectiveFrom: new Date("2024-12-27T20:39:00.000Z"),
    effectiveTo: null,
    extractionMethod: "ocr" as const,
    sourceQualityStatus: "ocr_exige_conferencia_visual" as const,
    extractionConfidence: "ocr_exige_conferencia_visual" as const,
    locators: { "1.4": "página 2", "2.1": "página 2", "2.2.b": "página 3", "2.3.b": "página 3", "2.4.b": "página 3", "2.12": "página 6", "2.15": "página 7" },
    documentText: `1.4. A renovação desta Licença deverá ser requerida num prazo mínimo de 120 (cento e vinte) dias, antes do término da sua validade.
2.1. Executar, em até 90 (noventa) dias após a emissão da licença ambiental, os Programas Ambientais abaixo relacionados, atendendo as recomendações presentes no Parecer Técnico nº 193/2023-Dilac/Calaf/Dilic.
2.2.b. recuperar gradualmente os pontos de erosão no prazo de 3 (três) anos, apresentando os resultados intermediários nos relatórios anuais.
2.3.b. recuperar gradualmente as áreas de solo exposto dentro da faixa de domínio das rodovias por meio do plantio de gramíneas, sendo permitida a hidrossemeadura, no prazo de 2 (dois) anos, apresentando o resultado intermediário no primeiro relatório anual.
2.4.b. Submeter, no prazo de 270 dias, os gráficos e o banco de dados, com informações georreferenciadas, identificando as áreas de maior ocorrência de atropelamentos.
2.12. Elaborar e apresentar, em até 60 (sessenta) dias após a emissão da licença ambiental, o Programa de Remoção e Realocação de População (PRRP).
2.15. Encaminhar ao Ibama, até o dia 30 de janeiro de cada ano, o relatório consolidado de acompanhamento da implementação dos Programas Ambientais e do atendimento das Condicionantes referente ao ano anterior.`,
  },
] as const;
