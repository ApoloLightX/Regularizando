# Verificação de leitura pública sem JavaScript

## Escopo

Em 13/08/2026, o script `scripts/verify-ssr.sh` foi executado contra o domínio público com user agents de Googlebot e Facebook. A execução verificou a resposta HTML bruta, sem executar JavaScript no navegador.

## Resultado

As rotas `/`, `/produto`, `/casos-de-uso`, `/piloto-telecom`, `/seguranca` e `/contato` retornaram conteúdo dentro de `#root`, com título, descrição, `og:title`, cartão Twitter, canonical e URL Open Graph únicos. As normalizações de `/index.html` e de barra final, além das respostas 404, também foram aprovadas.

## Guardrail de conteúdo

A homepage agora entrega no HTML inicial todos os quatro passos da rotina operacional: organizar, priorizar, comprovar e ampliar. A seção não depende mais de uma aba JavaScript para revelar os próximos passos; isso reduz a perda de contexto em leitores estáticos e rastreadores.

## Limite conhecido

As rotas autenticadas permanecem intencionalmente excluídas da indexação e não incluem dados de organização no HTML inicial.
