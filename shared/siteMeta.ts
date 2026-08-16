export type SiteMeta = {
  title: string;
  description: string;
  canonicalPath?: string;
  noindex?: boolean;
  notFound?: boolean;
};

const site = "Regularizando";
const publicPages: Record<string, SiteMeta> = {
  "/": {
    title: "Regularizando | Gestão ambiental verificável",
    description: "Centralize licenças, condicionantes, responsáveis e evidências para tornar a gestão ambiental rastreável.",
    canonicalPath: "/",
  },
  "/produto": {
    title: "Plataforma de Gestão Ambiental | Regularizando",
    description: "Licenciamento, condicionantes, evidências, operação EHS, indicadores ESG e contexto territorial em um fluxo auditável.",
    canonicalPath: "/produto",
  },
  "/demonstracao": {
    title: "Demonstração de gestão ambiental verificável | Regularizando",
    description: "Acompanhe uma simulação guiada do fluxo documento, revisão humana, responsabilidade, evidência e decisão no Regularizando.",
    canonicalPath: "/demonstracao",
  },
  "/implantacao-e-sucesso": {
    title: "Implantação e Sucesso | Regularizando",
    description: "Conheça a metodologia proposta de implantação acompanhada, rotina operacional e expansão gradual do Regularizando.",
    canonicalPath: "/implantacao-e-sucesso",
  },
  "/casos-de-uso": {
    title: "Regularizando para Telecom, Infraestrutura e Indústria",
    description: "Veja como equipes ambientais, EHS, ESG e auditoria usam evidências rastreáveis para reduzir riscos e retrabalho.",
    canonicalPath: "/casos-de-uso",
  },
  "/piloto-telecom": {
    title: "Piloto de Gestão Ambiental para Telecom | Regularizando",
    description: "Valide uma rotina centralizada de licenças, condicionantes e evidências em uma amostra de sites distribuídos.",
    canonicalPath: "/piloto-telecom",
  },
  "/contato": {
    title: "Solicitar piloto | Regularizando",
    description: "Planeje um piloto do Regularizando para transformar uma rotina ambiental real em evidências e decisões rastreáveis.",
    canonicalPath: "/contato",
  },
  "/seguranca": {
    title: "Segurança e governança | Regularizando",
    description: "Conheça os controles de acesso, rastreabilidade e revisão humana disponíveis no Regularizando.",
    canonicalPath: "/seguranca",
  },
  "/aviso-de-privacidade": {
    title: "Aviso de Privacidade | Regularizando",
    description: "Saiba quais dados são utilizados, para quais finalidades e como solicitar direitos de privacidade no Regularizando.",
    canonicalPath: "/aviso-de-privacidade",
  },
  "/direcoes-de-marca": {
    title: "Direções de marca | Regularizando",
    description: "Prévia interna de direções de marca do Regularizando.",
    noindex: true,
  },
};

export function isPrivatePath(path: string) {
  return ["/dashboard", "/comecar", "/evidencias", "/equipe", "/leads", "/validacao-tecnica", "/obrigacoes", "/fontes"].some((item) => path === item || path.startsWith(`${item}/`)) || path.startsWith("/convites/");
}

export function getSiteMeta(inputUrl: string): SiteMeta {
  const rawPath = inputUrl.split("?")[0] || "/";
  const path = rawPath.replace(/\/+$/, "") || "/";
  if (isPrivatePath(path)) return { title: `${site} | Área segura`, description: "Área autenticada do Regularizando.", noindex: true };
  return publicPages[path] ?? { title: `${site} | Página não encontrada`, description: "A página solicitada não existe.", noindex: true, notFound: true };
}
