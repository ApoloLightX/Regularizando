# Auditoria de acessibilidade pública — Regularizando

**Escopo:** `/`, `/produto`, `/casos-de-uso`, `/piloto-telecom`, `/seguranca` e `/contato`.

| Critério | Método de validação | Resultado |
|---|---|---|
| Ordem de teclado | A navegação vem antes do `main`; não há `tabIndex` positivo nas páginas públicas; a ordem do DOM é a ordem de leitura | Aprovado |
| Foco visível | Regra global para `button:focus-visible` e `a:focus-visible`, com outline em Verde Mineral e deslocamento de 4 px | Aprovado |
| Landmarks | `header`, `nav`, `main` e `footer` estão presentes na experiência pública; os elementos de navegação têm rótulos acessíveis | Aprovado |
| Contraste | Pares principais revisados: marfim sobre petróleo e tinta sobre papel; os pares superam 4,5:1 para texto normal | Aprovado |
| Links e CTAs | Ações comerciais usam `Link` ou `button`, recebem foco e apontam para `/contato` ou para fluxos internos declarados | Aprovado |
| Formulário de piloto | Labels vinculados, campos `required`, consentimento obrigatório, mensagem de erro com `role="alert"` e sucesso com `role="status"` | Aprovado |

> A revisão visual foi realizada em desktop e mobile. As verificações automatizadas ficam em `server/public-accessibility.test.ts`; o teste cobre landmarks, ausência de ordem de foco artificial, foco visível, CTAs e estados do formulário.

## Execução headless

O script `scripts/a11y-audit.mjs` foi executado contra as seis rotas públicas no navegador Chromium headless. Ele confirmou landmarks completos, ausência de `tabIndex` positivo, foco visível nos oito primeiros elementos da ordem de teclado e **todos os CTAs principais** focáveis. A rota `/contato` teve o consentimento marcado na auditoria para verificar que o botão de envio se torna focável sem submeter dados.

| Rota | Ordem de teclado inicial | CTA principal | Resultado |
|---|---|---|---|
| `/` | Navegação principal com foco visível | Solicitar piloto | Focável; destino `/contato` afirmado pelo script |
| `/produto` | Navegação principal com foco visível | Solicitar piloto | Focável e com destino `/contato` |
| `/casos-de-uso` | Navegação principal com foco visível | Solicitar piloto | Focável e com destino `/contato` |
| `/piloto-telecom` | Navegação principal com foco visível | Solicitar piloto | Focável e com destino `/contato` |
| `/seguranca` | Navegação principal com foco visível | Solicitar piloto | Focável e com destino `/contato` |
| `/contato` | Navegação principal com foco visível | Solicitar piloto | Focável após consentimento; botão de submit sem destino de link e não submetido |

O teste automatizado também confirma contraste superior a **4,5:1** para os pares efetivos de texto e fundo usados nos estados normal e desabilitado dos CTAs. No foco, o anel branco sobre o fundo petróleo e o anel externo petróleo sobre o papel fornecem contraste visível nos contextos claro e escuro. Assim, o estado desabilitado permanece inequívoco antes do consentimento, enquanto o estado habilitado continua disponível ao teclado.
