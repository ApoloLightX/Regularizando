const baseUrl = "http://localhost:3000";
const routes = ["/", "/produto", "/casos-de-uso", "/piloto-telecom", "/seguranca", "/contato"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function createTarget(url) {
  const response = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  return response.json();
}
async function inspectRoute(route) {
  const target = await createTarget(`${baseUrl}${route}`);
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let sequence = 0;
  const pending = new Map();
  ws.onmessage = (event) => { const message = JSON.parse(event.data); if (message.id) pending.get(message.id)?.(message); };
  await new Promise((resolve) => { ws.onopen = resolve; });
  const call = (method, params = {}) => new Promise((resolve) => { const id = ++sequence; pending.set(id, (message) => { pending.delete(id); resolve(message); }); ws.send(JSON.stringify({ id, method, params })); });
  await wait(900);
  const snapshot = await call("Runtime.evaluate", { expression: `(() => ({
    landmarks: ["header", "nav", "main", "footer"].every((tag) => Boolean(document.querySelector(tag))),
    positiveTabindex: [...document.querySelectorAll("[tabindex]")].some((node) => Number(node.getAttribute("tabindex")) > 0),
    actionable: [...document.querySelectorAll('a[href], button:not([disabled])')].map((node) => ({ tag: node.tagName, text: node.textContent.trim().replace(/\\s+/g, " ").slice(0, 80), href: node.getAttribute("href") })).filter((item) => item.text),
    form: Boolean(document.querySelector("form")),
    title: document.title
  }))()`, returnByValue: true });
  const focusSequence = [];
  for (let index = 0; index < 8; index += 1) {
    await call("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await call("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    const active = await call("Runtime.evaluate", { expression: `(() => { const el = document.activeElement; const style = getComputedStyle(el); return { tag: el?.tagName, text: el?.textContent?.trim().replace(/\\s+/g, " ").slice(0, 50), outline: style.outlineStyle !== "none" && style.outlineWidth !== "0px" }; })()`, returnByValue: true });
    focusSequence.push(active.result.result.value);
  }
  const actionablePrimaryCtas = snapshot.result.result.value.actionable.filter((item) => /Solicitar piloto|Começar agora|Planejar piloto|Desenhar piloto/i.test(item.text));
  const primaryCtas = await call("Runtime.evaluate", { expression: `(() => { const consent = document.querySelector('.consent-check input'); if (consent && !consent.checked) consent.click(); const ctas = [...document.querySelectorAll('main a.button, main button.button:not([disabled])')].filter((node) => /Solicitar piloto|Começar agora|Planejar piloto|Desenhar piloto/i.test(node.textContent)); return ctas.map((el) => { el.focus(); return { text: el.textContent.trim().replace(/\\s+/g, " "), href: el.getAttribute("href"), focusable: document.activeElement === el && el.tabIndex >= 0 }; }); })()`, returnByValue: true });
  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
  return { route, expectedHref: route === "/contato" ? null : "/contato", snapshot: snapshot.result.result.value, focusSequence, actionablePrimaryCtas, ctaResults: primaryCtas.result.result.value };
}

const report = [];
for (const route of routes) report.push(await inspectRoute(route));
for (const entry of report) {
  if (!entry.snapshot.landmarks || entry.snapshot.positiveTabindex || entry.focusSequence.some((item) => !item.outline) || entry.actionablePrimaryCtas.length === 0 || entry.ctaResults.length === 0 || entry.ctaResults.some((cta) => !cta.focusable || cta.href !== entry.expectedHref)) throw new Error(`Falha de acessibilidade em ${entry.route}`);
}
console.log(JSON.stringify(report, null, 2));
