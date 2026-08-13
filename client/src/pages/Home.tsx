// Regularizando / Observatório Terra: landing editorial-cartográfica para EHS, ESG
// e engenharia ambiental. Evidência primeiro, assimetria intencional e microcopy operacional.
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CircleAlert,
  FileCheck2,
  Globe2,
  Leaf,
  Menu,
  MessageSquareText,
  Radar,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

const logoUrl = "/manus-storage/regularizando-mark_ccce30b2.png";
const heroUrl = "/manus-storage/regularizando-topographic-hero_03f09fb6.png";
const ehsUrl = "/manus-storage/regularizando-ehs-field_bce54276.png";
const esgUrl = "/manus-storage/regularizando-esg-evidence_9448fc14.png";
const gisUrl = "/manus-storage/regularizando-gis-territory_639b4fd3.png";

type ModuleKey = "radar" | "ehs" | "esg" | "territory";

const modules: Record<ModuleKey, { eyebrow: string; title: string; body: string; image: string; points: string[]; icon: typeof Radar }> = {
  radar: {
    eyebrow: "01 / Núcleo: Licenciamento & Obrigações",
    title: "Transforme cada obrigação em uma rotina que a equipe consegue comprovar.",
    body: "Organize licenças, condicionantes, documentos, prazos e responsáveis por ativo. A equipe enxerga o que falta e decide com a fonte à vista.",
    image: gisUrl,
    points: ["Licenças, condicionantes e requisitos", "Prazos, pendências e responsáveis", "Evidência e revisão antes da decisão"],
    icon: FileCheck2,
  },
  ehs: {
    eyebrow: "02 / Módulo: Operação & não conformidades",
    title: "Leve do desvio em campo ao plano de ação verificável.",
    body: "Inspeções, incidentes e não conformidades passam a uma rotina de responsável, prazo, evidência e verificação de eficácia.",
    image: ehsUrl,
    points: ["Inspeções com fotos e localização", "Planos de ação e responsáveis por prazo", "Desvio, evidência e verificação de eficácia"],
    icon: ShieldCheck,
  },
  esg: {
    eyebrow: "03 / Módulo: Indicadores ambientais & ESG",
    title: "Reporte o impacto sem perder a origem do dado.",
    body: "Métricas ambientais, fontes, períodos, unidades e responsáveis conectados a documentos e revisão: uma base rastreável para reporte.",
    image: esgUrl,
    points: ["Catálogo de métricas e unidades", "Escopos, fontes e metodologia", "Evidências prontas para revisão"],
    icon: Leaf,
  },
  territory: {
    eyebrow: "04 / Módulo: Território / GIS",
    title: "Entenda o local antes de decidir o próximo passo.",
    body: "Não é um mapa pronto nem uma conclusão automática. O módulo começa quando o ativo tem localização e fontes geográficas reais vinculadas para revisão técnica.",
    image: gisUrl,
    points: ["Entrada: endereço ou coordenadas do ativo", "Cruzamento: camadas oficiais com fonte e data", "Saída: sinal para revisão, nunca decisão automática"],
    icon: Globe2,
  },
};

const evidenceRows = [
  { label: "Licença de Operação", meta: "Vence em 42 dias", tone: "warn", icon: CircleAlert },
  { label: "Condicionante 07 / efluentes", meta: "Evidência verificada", tone: "ok", icon: FileCheck2 },
  { label: "Inspeção de ativo / torre 18", meta: "Ação corretiva aberta", tone: "open", icon: MessageSquareText },
];

function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`brand ${compact ? "brand--compact" : ""}`} href="#top" aria-label="Regularizando, voltar ao início">
      <img src={logoUrl} alt="" className="brand__mark" onError={(event) => { event.currentTarget.style.opacity = "0"; }} />
      <span className="brand__name">regularizando</span>
    </a>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const pendingInvite = sessionStorage.getItem("regularizando-pending-invite");
    if (pendingInvite) setLocation(`/convites/${pendingInvite}`);
  }, [setLocation]);
  const [activeModule, setActiveModule] = useState<ModuleKey>("radar");
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const active = modules[activeModule];
  const ActiveIcon = active.icon;

  const selectModule = (key: ModuleKey) => {
    setActiveModule(key);
    setMenuOpen(false);
  };

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <div className="header-inner">
          <AppLogo />
          <button className="menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className={`main-nav ${menuOpen ? "main-nav--open" : ""}`} aria-label="Navegação principal">
            <Link href="/produto" onClick={() => setMenuOpen(false)}>Produto</Link>
            <Link href="/casos-de-uso" onClick={() => setMenuOpen(false)}>Casos de uso</Link>
            <Link href="/seguranca" onClick={() => setMenuOpen(false)}>Segurança</Link>
            <Link href="/piloto-telecom" onClick={() => setMenuOpen(false)}>Piloto telecom</Link>
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Entrar</Link>
          </nav>
          <div className="header-actions">
            <Link className="text-link" href="/dashboard">Entrar <ArrowRight size={15} /></Link>
            <Link className="button button--nav" href="/contato">Solicitar piloto</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__image" style={{ backgroundImage: `url(${heroUrl})` }} aria-hidden="true" />
          <div className="hero__grain" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="eyebrow eyebrow--light"><span className="eyebrow-dot" /> Inteligência ambiental verificável</p>
              <h1 id="hero-title">Gestão ambiental sem <em>planilhas dispersas.</em></h1>
              <p className="hero-lede">Centralize licenças, condicionantes, responsáveis e documentos. O Regularizando identifica pendências e organiza evidências para a revisão do profissional responsável.</p>
              <div className="hero-actions">
                <Link className="button button--mint" href="/contato">Solicitar piloto <ArrowDownRight size={17} /></Link>
                <button className="button button--ghost-light" type="button" onClick={() => setDemoOpen(true)}>Ver demonstração</button>
              </div>
              <div className="hero-proof"><span><Check size={15} /> IA organiza. O profissional valida.</span><span><Check size={15} /> Cada decisão permanece rastreável.</span></div>
            </div>

            <div className="hero-panel" aria-label="Prévia do painel Regularizando">
              <div className="panel-topline"><span><span className="live-dot" /> Visão do portfólio</span><span className="panel-date">12 ago 2026</span></div>
              <div className="panel-title-row"><div><p className="panel-kicker">Centro logístico · SP</p><h2>Prontidão documental</h2></div><span className="score score--attention">Atenção</span></div>
              <div className="panel-progress"><span style={{ width: "72%" }} /></div>
              <div className="panel-meta"><span>72% de cobertura documental</span><span>3 pendências críticas</span></div>
              <div className="evidence-list">
                {evidenceRows.map((row) => {
                  const Icon = row.icon;
                  return <div className="evidence-row" key={row.label}><span className={`evidence-icon evidence-icon--${row.tone}`}><Icon size={15} /></span><span className="evidence-copy"><strong>{row.label}</strong><small>{row.meta}</small></span><ArrowRight className="evidence-arrow" size={15} /></div>;
                })}
              </div>
              <button className="panel-link" type="button" onClick={() => setLocation("/dashboard")}>Abrir dashboard <ArrowRight size={15} /></button>
            </div>
          </div>
          <div className="hero-index" aria-hidden="true"><span>01</span><span className="hero-index-line" /><span>04</span></div>
        </section>

        <section className="signal-strip" aria-label="Áreas conectadas">
          <div className="signal-inner"><span className="signal-label">Comece por</span><span>Licenciamento</span><i /><span>e expanda para</span><i /><span>EHS</span><i /><span>ESG</span><i /><span>Território</span></div>
        </section>

        <section className="proof-demo" id="demonstracao" aria-labelledby="proof-demo-title">
          <div className="proof-demo__heading"><p className="eyebrow">Do documento à evidência auditável</p><h2 id="proof-demo-title">Veja a pendência antes que ela vire retrabalho.</h2><p>O produto transforma uma obrigação dispersa em uma fila clara de verificação, responsabilidade e decisão.</p></div>
          <div className="proof-demo__workspace">
            <div className="proof-demo__table" role="table" aria-label="Prévia de condicionantes ambientais">
              <div className="proof-demo__row proof-demo__row--head" role="row"><span>Condicionante</span><span>Status</span><span>Prazo</span><span>Evidência</span><span>Responsável</span></div>
              <div className="proof-demo__row" role="row"><strong>Monitoramento hídrico</strong><span className="status-dot status-dot--warn">Atenção</span><span>17 dias</span><span>2 / 3</span><span>Marina</span></div>
              <div className="proof-demo__row" role="row"><strong>Relatório semestral</strong><span className="status-dot status-dot--review">Em revisão</span><span>41 dias</span><span>5 / 5</span><span>Gabriel</span></div>
              <div className="proof-demo__row" role="row"><strong>Ruído ambiental</strong><span className="status-dot status-dot--open">Pendente</span><span>8 dias</span><span>0 / 2</span><span>Carlos</span></div>
            </div>
            <aside className="proof-demo__finding"><span className="finding-label"><CircleAlert size={14} /> Pendência identificada</span><h3>O laudo anexado não contém o parâmetro DBO exigido pelo requisito.</h3><dl><div><dt>Fonte identificada</dt><dd>Licença ambiental · página 14</dd></div><div><dt>Evidência relacionada</dt><dd>Laudo_Efluentes_Julho.pdf</dd></div><div><dt>Status</dt><dd>Aguardando revisão técnica</dd></div></dl><Link href="/produto" className="arrow-link">Entender o fluxo verificável <ArrowRight size={16} /></Link></aside>
          </div>
        </section>

        <section className="intro-section" id="sistema" aria-labelledby="intro-title">
          <div className="section-number">01 <span>O sistema</span></div>
          <div className="intro-grid">
            <div className="intro-statement"><p className="eyebrow">A nova rotina de conformidade</p><h2 id="intro-title">Menos caça a arquivo. Mais clareza para agir.</h2></div>
            <div className="intro-copy"><p>Equipes ambientais não precisam de mais uma pasta. Precisam saber qual obrigação vence, qual evidência falta, quem decide e o que acontece depois.</p><p>O Regularizando organiza essa complexidade em uma cadeia clara: obrigação, requisito, prazo, responsável, evidência, revisão e decisão. IA apoia a triagem; o profissional responsável valida.</p><a className="arrow-link" href="#governanca">Veja como protegemos a decisão <ArrowRight size={16} /></a></div>
          </div>
          <div className="principles-row"><div><span className="principle-index">01</span><strong>Antecipar</strong><p>Encontre inconsistências antes do protocolo.</p></div><div><span className="principle-index">02</span><strong>Conectar</strong><p>Una campo, documento, métrica e mapa.</p></div><div><span className="principle-index">03</span><strong>Comprovar</strong><p>Leve cada número até sua evidência.</p></div></div>
        </section>

        <section className="home-use-cases" aria-labelledby="home-cases-title"><div><p className="eyebrow">Cenários que orientam o produto</p><h2 id="home-cases-title">O mesmo sistema, aplicado a problemas que custam tempo e confiança.</h2></div><div className="home-use-cases__grid"><article><span>01</span><h3>Sites distribuídos</h3><p>Carteira de licenças, condicionantes e evidências amarrada ao código de cada ativo.</p><Link href="/casos-de-uso">Ver caso telecom <ArrowRight size={15} /></Link></article><article><span>02</span><h3>Obras e infraestrutura</h3><p>Inspeções, condicionantes e planos de ação conectados da frente de obra à renovação.</p><Link href="/casos-de-uso">Ver caso de obra <ArrowRight size={15} /></Link></article><article><span>03</span><h3>Indicadores ambientais & ESG</h3><p>Cada indicador preserva período, unidade, fonte, meta e status de revisão.</p><Link href="/casos-de-uso">Ver caso de indicadores <ArrowRight size={15} /></Link></article></div><Link className="arrow-link" href="/casos-de-uso">Explorar todos os casos de uso <ArrowRight size={16} /></Link></section>

        <section className="modules-section" id="modulos" aria-labelledby="modules-title">
          <div className="section-heading"><div><p className="eyebrow eyebrow--light">Um núcleo que conecta módulos</p><h2 id="modules-title">Comece pelo licenciamento.<br />Expanda quando fizer sentido.</h2></div><span className="heading-note">O núcleo organiza obrigações.<br />Os módulos aprofundam a rotina.</span></div>
          <div className="modules-layout">
            <div className="module-tabs" role="tablist" aria-label="Módulos Regularizando">
              {(Object.keys(modules) as ModuleKey[]).map((key) => {
                const item = modules[key];
                const Icon = item.icon;
                return <button className={`module-tab ${activeModule === key ? "module-tab--active" : ""}`} type="button" role="tab" aria-selected={activeModule === key} key={key} onClick={() => selectModule(key)}><span className="module-tab__index">{item.eyebrow.slice(0, 2)}</span><span className="module-tab__copy"><strong>{item.eyebrow.slice(5)}</strong><small>{key === "radar" ? "Requisitos e licenças" : key === "ehs" ? "Campo e operação" : key === "esg" ? "Métricas e disclosure" : "Localização e fontes reais"}</small></span><Icon size={19} /></button>;
              })}
            </div>
            <div className="module-detail" key={activeModule}>
              <div className={`module-detail__visual module-detail__visual--${activeModule}`}>{activeModule === "territory" ? <div className="territory-module-explainer"><span>1. Local do ativo</span><ArrowRight size={16} /><span>2. Camadas oficiais</span><ArrowRight size={16} /><span>3. Revisão técnica</span></div> : <div className="visual-media" role="img" aria-label={`Visual do módulo ${active.eyebrow.slice(5)}`} />}<div className="visual-tag"><ActiveIcon size={14} /> {activeModule === "territory" ? "Dados reais necessários" : "Camada ativa"}</div></div>
              <div className="module-detail__copy"><p className="eyebrow eyebrow--light">{active.eyebrow}</p><h3>{active.title}</h3><p>{active.body}</p><ul>{active.points.map((point) => <li key={point}><Check size={15} /> {point}</li>)}</ul><button className="arrow-link arrow-link--light" type="button" onClick={() => setLocation("/dashboard")}>Ver esta camada em ação <ArrowRight size={16} /></button></div>
            </div>
          </div>
        </section>

        <section className="territory-section" id="territorio" aria-labelledby="territory-title">
          <div className="territory-visual territory-visual--guided" aria-label="Como funciona uma leitura territorial com dados reais"><div className="territory-guide"><p className="territory-guide__label">O que o módulo precisa receber</p><div className="territory-guide__step"><span>01</span><div><strong>Ativo identificado</strong><p>Endereço, município ou coordenadas reais.</p></div></div><div className="territory-guide__step"><span>02</span><div><strong>Camadas com origem</strong><p>Fonte oficial, versão e data da consulta.</p></div></div><div className="territory-guide__step"><span>03</span><div><strong>Leitura para revisão</strong><p>Um sinal de atenção para a equipe, não uma decisão legal automática.</p></div></div><p className="territory-guide__guard">Sem localização e fonte vinculadas, nenhuma camada, alerta ou sobreposição é exibida.</p></div></div>
          <div className="territory-copy"><p className="eyebrow">Território / GIS, explicado</p><h2 id="territory-title">Não é um mapa decorativo. É contexto para revisar o ativo certo.</h2><p>Quando você informa onde está um ativo, o Regularizando pode organizar a consulta de camadas geográficas relevantes para aquele local. A equipe vê a origem e a data de cada camada antes de decidir se precisa investigar algo.</p><div className="territory-stats"><div><strong>Entrada</strong><span>localização real do ativo</span></div><div><strong>Consulta</strong><span>fontes e data registradas</span></div><div><strong>Saída</strong><span>revisão técnica necessária</span></div></div><p className="territory-source">Demonstração conceitual do fluxo · Atualização: 12/08/2026. Não há mapa, camada, alerta ou resultado territorial ativo nesta página; isso só acontece no piloto com dados reais e fontes identificadas.</p><Link className="arrow-link" href="/piloto-telecom">Planejar uma leitura territorial real <ArrowRight size={16} /></Link></div>
        </section>

        <section className="governance-section" id="governanca" aria-labelledby="governance-title">
          <div className="section-number section-number--dark">02 <span>Governança</span></div>
          <div className="governance-grid"><div><p className="eyebrow">IA com responsabilidade</p><h2 id="governance-title">IA que você consegue <em>auditar.</em></h2></div><div className="governance-copy"><p>A IA organiza documentos, sugere campos e aponta divergências. A equipe técnica revisa, aprova e mantém o contexto. Assim, automação não vira caixa-preta: cada resultado aponta a fonte e permanece sujeito à decisão humana.</p><div className="audit-trail"><span>Fonte original</span><ArrowRight size={14} /><span>Requisito relacionado</span><ArrowRight size={14} /><span>Pendência detectada</span><ArrowRight size={14} /><span>Revisão humana</span><ArrowRight size={14} /><span>Decisão e histórico</span></div><div className="governance-card"><div className="governance-card__icon"><Sparkles size={19} /></div><div><strong>Uma resposta nunca vem sozinha.</strong><p>Ela vem com evidência, versão e próxima ação.</p></div><span className="verified-pill"><Check size={13} /> auditável</span></div></div></div>
        </section>

        <section className="cta-section" id="contato" aria-labelledby="cta-title"><div className="cta-map" aria-hidden="true" /><div className="cta-inner"><div className="cta-evidence"><div className="cta-evidence__top"><span>Próxima decisão</span><span>04 / 04</span></div><div className="cta-evidence__line"><span className="cta-evidence__marker"><Check size={14} /></span><div><strong>Contexto pronto para revisão</strong><small>Fontes, responsáveis e próximos passos conectados.</small></div></div><div className="cta-evidence__footer"><span className="verified-pill"><Check size={13} /> evidência verificada</span><ArrowRight size={15} /></div></div><div className="cta-copy"><p className="eyebrow eyebrow--light">Comece por uma obrigação real</p><h2 id="cta-title">Transforme sua primeira rotina em um piloto verificável.</h2><p>Selecione uma carteira de licenças, condicionantes ou sites e descubra onde estão os prazos, evidências e responsáveis que exigem atenção.</p><Link className="button button--mint" href="/contato">Solicitar piloto <ArrowRight size={17} /></Link></div></div></section>
      </main>

      <footer className="site-footer"><AppLogo compact /><p>Inteligência para decisões ambientais mais confiáveis.</p><div className="footer-meta"><span>© 2026 Regularizando</span><span>Feito para EHS, ESG e engenharia ambiental</span></div></footer>

      {demoOpen && <div className="modal-backdrop" role="presentation" onClick={() => setDemoOpen(false)}><div className="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Fechar demonstração" onClick={() => setDemoOpen(false)}><X size={18} /></button><div className="modal-icon"><Radar size={20} /></div><p className="eyebrow">Demonstração guiada</p><h2 id="demo-title">Veja o Regularizando pensando junto com sua equipe.</h2><p>O caminho agora é direto: entre no dashboard, crie sua organização e cadastre o primeiro ativo ou licença.</p><button className="button button--nav button--full" type="button" onClick={() => { setDemoOpen(false); setLocation("/dashboard"); }}>Acessar o dashboard <ArrowRight size={16} /></button><button className="modal-secondary" type="button" onClick={() => setDemoOpen(false)}>Continuar explorando o site</button></div></div>}
    </div>
  );
}
