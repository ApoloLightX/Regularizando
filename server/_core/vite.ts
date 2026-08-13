import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import superjson from "superjson";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getSiteMeta, type SiteMeta } from "../../shared/siteMeta";

const canonicalOrigin = (process.env.CANONICAL_ORIGIN ?? "").replace(/\/$/, "");
const siteName = process.env.SITE_NAME ?? "Regularizando";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildHead(meta: SiteMeta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = meta.canonicalPath && canonicalOrigin ? `${canonicalOrigin}${meta.canonicalPath}` : "";
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="robots" content="${meta.noindex || meta.notFound ? "noindex, follow" : "index, follow"}" />`,
  ];
  if (canonical) tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  if (!meta.noindex && !meta.notFound) tags.push(`<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Regularizando","applicationCategory":"BusinessApplication","operatingSystem":"Web","url":"${escapeHtml(canonicalOrigin || "https://regulaisaas-hydgpjgu.manus.space")}"}</script>`);
  return tags.join("\n");
}

function composeHtml(template: string, appHtml: string, meta: SiteMeta, dehydratedState: unknown) {
  const safeState = JSON.stringify(superjson.serialize(dehydratedState)).replace(/</g, "\\u003c");
  return template
    .replace("<!--app-head-->", () => buildHead(meta))
    .replace("<!--app-html-->", () => appHtml)
    .replace("</body>", () => `<script>window.__RQ_STATE__=${safeState}</script></body>`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
    appType: "custom",
  });
  app.use((req, res, next) => {
    if (req.path === "/index.html") return res.redirect(301, "/");
    if (req.path !== "/" && /\/+$/ .test(req.path)) return res.redirect(301, req.path.replace(/\/+$/ , "") || "/");
    next();
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const templatePath = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace(`src="/src/entry-client.tsx"`, `src="/src/entry-client.tsx?v=${nanoid()}"`);
      template = await vite.transformIndexHtml(req.originalUrl, template);
      template = template.replace("</head>", `<link rel="stylesheet" href="/src/index.css?direct" data-ssr-dev-css></head>`);
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
      const { html, dehydratedState, meta } = await render(req.originalUrl);
      res.status(meta.notFound ? 404 : 200).set("Cache-Control", "no-cache").type("html").end(composeHtml(template, html, meta, dehydratedState));
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = process.env.NODE_ENV === "development" ? path.resolve(import.meta.dirname, "../..", "dist", "public") : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) console.error(`Could not find the build directory: ${distPath}`);
  app.use((req, res, next) => {
    if (req.path === "/index.html") return res.redirect(301, "/");
    if (req.path !== "/" && /\/+$/ .test(req.path)) return res.redirect(301, req.path.replace(/\/+$/ , "") || "/");
    next();
  });
  app.use(express.static(distPath, { index: false, redirect: false }));
  app.use("*", async (req, res) => {
    const templatePath = path.resolve(distPath, "index.html");
    try {
      const template = await fs.promises.readFile(templatePath, "utf-8");
      const entryPath = path.resolve(import.meta.dirname, "server-ssr", "entry-server.js");
      const { render } = await import(entryPath);
      const { html, dehydratedState, meta } = await render(req.originalUrl);
      res.status(meta.notFound ? 404 : 200).set("Cache-Control", "no-cache").type("html").end(composeHtml(template, html, meta, dehydratedState));
    } catch (error) {
      console.error("[SSR] render failed, serving client shell:", error);
      const template = await fs.promises.readFile(templatePath, "utf-8");
      const meta = getSiteMeta(req.originalUrl);
      res.status(meta.notFound ? 404 : 200).set("Cache-Control", "no-cache").type("html").end(composeHtml(template, "", meta, {}));
    }
  });
}
