# Verificação de clareza — Território/GIS

## Resultado

Em 13/08/2026, a seção pública de Território/GIS foi inspecionada em uma moldura de **375 × 812 px**. A apresentação móvel mostra um fluxo de três passos — ativo identificado, camadas com origem e leitura para revisão — antes do título explicativo. Não há aparência de mapa ativo, ponto geográfico, raio, sobreposição ou alerta concluído.

## Limites comunicados

O conteúdo informa explicitamente que a análise territorial depende de localização real do ativo e de fontes geográficas identificadas. Sem esses dados, a página não exibe camada, alerta ou sobreposição. A saída declarada é um sinal para revisão técnica, e não uma conclusão legal automática.

## Cobertura de regressão

Os testes `server/marketing-positioning.test.ts` e `server/gis-mobile-layout.test.ts` verificam os três passos do fluxo territorial, a mensagem de bloqueio por ausência de dados reais e as regras específicas do breakpoint móvel de até 700 px. Essa cobertura é reproduzível pelo comando `pnpm test`.

## Verificação visual reproduzível

Com o servidor local em execução, rode `node scripts/validate-gis-mobile.mjs`. O procedimento usa Chromium controlado por Puppeteer em **375 × 812 px**, rola até `#territorio`, confirma a presença do guia e da cópia explicativa, rejeita os antigos indicadores simulados e grava a captura fora do repositório, em `/home/ubuntu/webdev-static-assets/regularizando-gis-territorio-375.png`. O arquivo de projeto permanece livre de mídias estáticas de validação.
