// Regularizando / Observatório Terra: landing editorial-cartográfica para EHS, ESG
// e engenharia ambiental. Evidência primeiro, assimetria intencional e microcopy operacional.
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
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

type ModuleKey = "radar" | "ehs" | "esg";

const modules: Record<ModuleKey, { eyebrow: string; title: string; body: string; image: string; points: string[]; icon: typeof Radar }> = {
  radar: {
    eyebrow: "01 / Radar regulatório",
    title: "Saiba o que precisa ser comprovado antes do protocolo.",
    body: "Cruze atividade, território, órgão e fase do empreendimento para transformar incerteza regulatória em uma sequência de decisões rastreáveis.",
    image: gisUrl,
    points: ["Requisitos por atividade e localização", "LP, LI, LO e dependências", "Alertas de validade e complementação"],
    icon: Radar,
  },
  ehs: {
    eyebrow: "02 / Operação EHS",
    title: "Leve a evidência do campo para a decisão.",
    body: "Inspeções, quase acidentes, riscos, treinamentos e ações corretivas deixam de viver em planilhas isoladas e passam a compor uma linha do tempo operacional.",
    image: ehsUrl,
    points: ["Inspeções com fotos e localização", "CAPA e responsáveis por prazo", "Contratadas, riscos e permissões"],
    icon: ShieldCheck,
  },
  esg: {
    eyebrow: "03 / ESG rastreável",
    title: "Reporte o impacto sem perder a origem do dado.",
    body: "Métricas, fatores de emissão, fontes e versões conectados a documentos e responsáveis: a base para materialidade, assurance e decisões melhores.",
    image: esgUrl,
    points: ["Catálogo de métricas e unidades", "Escopos, fontes e metodologia", "Evidências prontas para revisão"],
    icon: Leaf,
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
            <Link href="/piloto-telecom" onClick={() => setMenuOpen(false)}>Piloto telecom</Link>
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          </nav>
          <div className="header-actions">
            <Link className="text-link" href="/piloto-telecom">Planejar piloto <ArrowRight size={15} /></Link>
            <button className="button button--nav" type="button" onClick={() => setLocation("/dashboard")}>Começar agora</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__image" style={{ backgroundImage: `url(${heroUrl})` }} aria-hidden="true" />
          <div className="hero__grain" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="eyebrow eyebrow--light"><span className="eyebrow-dot" /> Sistema operacional de evidências ambientais</p>
              <h1 id="hero-title">Do documento disperso à <em>decisão verificável.</em></h1>
              <p className="hero-lede">O Regularizando conecta licenciamento ambiental, EHS e ESG para que sua equipe encontre o risco antes que ele vire retrabalho.</p>
              <div className="hero-actions">
                <button className="button button--mint" type="button" onClick={() => setLocation("/dashboard")}>Começar agora <ArrowDownRight size={17} /></button>
                <Link className="button button--ghost-light" href="/produto">Conhecer os módulos</Link>
              </div>
              <div className="hero-proof"><span><Check size={15} /> Rastreável por evidência</span><span><Check size={15} /> Revisão humana por padrão</span></div>
            </div>

            <div className="hero-panel" aria-label="Prévia do painel Regularizando">
              <div className="panel-topline"><span><span className="live-dot" /> Visão do portfólio</span><span className="panel-date">12 ago 2026</span></div>
              <div className="panel-title-row"><div><p className="panel-kicker">Centro logístico · SP</p><h2>Prontidão ambiental</h2></div><span className="score">B<span>/A</span></span></div>
              <div className="panel-progress"><span style={{ width: "72%" }} /></div>
              <div className="panel-meta"><span>17 evidências verificadas</span><span>6 em análise</span></div>
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
          <div className="signal-inner"><span className="signal-label">Uma camada de inteligência para</span><span>Licenciamento</span><i /><span>EHS</span><i /><span>ESG</span><i /><span>Engenharia ambiental</span></div>
        </section>

        <section className="intro-section" id="sistema" aria-labelledby="intro-title">
          <div className="section-number">01 <span>O sistema</span></div>
          <div className="intro-grid">
            <div className="intro-statement"><p className="eyebrow">A nova rotina de conformidade</p><h2 id="intro-title">Menos caça a arquivo. Mais clareza para agir.</h2></div>
            <div className="intro-copy"><p>Equipes ambientais não precisam de mais uma pasta. Precisam saber qual obrigação vence, qual evidência falta, quem decide e o que acontece depois.</p><p>O Regularizando organiza essa complexidade em um fluxo vivo de requisitos, dados, pessoas e território — com IA para acelerar a triagem e governança para manter a decisão confiável.</p><a className="arrow-link" href="#governanca">Veja como protegemos a decisão <ArrowRight size={16} /></a></div>
          </div>
          <div className="principles-row"><div><span className="principle-index">01</span><strong>Antecipar</strong><p>Encontre inconsistências antes do protocolo.</p></div><div><span className="principle-index">02</span><strong>Conectar</strong><p>Una campo, documento, métrica e mapa.</p></div><div><span className="principle-index">03</span><strong>Comprovar</strong><p>Leve cada número até sua evidência.</p></div></div>
        </section>

        <section className="home-use-cases" aria-labelledby="home-cases-title"><div><p className="eyebrow">Cenários que orientam o produto</p><h2 id="home-cases-title">O mesmo sistema, aplicado a problemas que custam tempo e confiança.</h2></div><div className="home-use-cases__grid"><article><span>01</span><h3>Sites distribuídos</h3><p>Carteira de licenças, condicionantes e evidências amarrada ao código de cada ativo.</p><Link href="/casos-de-uso">Ver caso telecom <ArrowRight size={15} /></Link></article><article><span>02</span><h3>Obras e infraestrutura</h3><p>CAPA, inspeção e condicionante conectadas desde a frente de obra até a renovação.</p><Link href="/casos-de-uso">Ver caso de obra <ArrowRight size={15} /></Link></article><article><span>03</span><h3>ESG corporativo</h3><p>Cada indicador preserva período, unidade, fonte, meta e status de revisão.</p><Link href="/casos-de-uso">Ver caso ESG <ArrowRight size={15} /></Link></article></div><Link className="arrow-link" href="/casos-de-uso">Explorar todos os casos de uso <ArrowRight size={16} /></Link></section>

        <section className="modules-section" id="modulos" aria-labelledby="modules-title">
          <div className="section-heading"><div><p className="eyebrow eyebrow--light">As quatro camadas do produto</p><h2 id="modules-title">Um sistema que acompanha<br />o ciclo inteiro.</h2></div><span className="heading-note">Selecione uma frente<br />para ver o fluxo.</span></div>
          <div className="modules-layout">
            <div className="module-tabs" role="tablist" aria-label="Módulos Regularizando">
              {(Object.keys(modules) as ModuleKey[]).map((key) => {
                const item = modules[key];
                const Icon = item.icon;
                return <button className={`module-tab ${activeModule === key ? "module-tab--active" : ""}`} type="button" role="tab" aria-selected={activeModule === key} key={key} onClick={() => selectModule(key)}><span className="module-tab__index">{item.eyebrow.slice(0, 2)}</span><span className="module-tab__copy"><strong>{item.eyebrow.slice(5)}</strong><small>{key === "radar" ? "Requisitos e licenças" : key === "ehs" ? "Campo e operação" : "Métricas e disclosure"}</small></span><Icon size={19} /></button>;
              })}
              <div className="module-tab module-tab--territory"><span className="module-tab__index">04</span><span className="module-tab__copy"><strong>Território</strong><small>GIS e contexto ambiental</small></span><Globe2 size={19} /></div>
            </div>
            <div className="module-detail" key={activeModule}>
              <div className={`module-detail__visual module-detail__visual--${activeModule}`}><div className="visual-media" role="img" aria-label={`Visual do módulo ${active.eyebrow.slice(5)}`} /><div className="visual-tag"><ActiveIcon size={14} /> Camada ativa</div></div>
              <div className="module-detail__copy"><p className="eyebrow eyebrow--light">{active.eyebrow}</p><h3>{active.title}</h3><p>{active.body}</p><ul>{active.points.map((point) => <li key={point}><Check size={15} /> {point}</li>)}</ul><button className="arrow-link arrow-link--light" type="button" onClick={() => setLocation("/dashboard")}>Ver esta camada em ação <ArrowRight size={16} /></button></div>
            </div>
          </div>
        </section>

        <section className="territory-section" id="territorio" aria-labelledby="territory-title">
          <div className="territory-visual"><div className="territory-media" role="img" aria-label="Ilustração cartográfica de camadas territoriais e uma área de projeto" /><span className="map-chip map-chip--top"><span className="map-chip-dot" /> Área de influência</span><span className="map-chip map-chip--bottom">Camadas ambientais <ChevronDown size={14} /></span></div>
          <div className="territory-copy"><p className="eyebrow">Contexto que muda a decisão</p><h2 id="territory-title">O território também é uma evidência.</h2><p>Antes de abrir uma frente de trabalho, entenda o que existe ao redor: unidades de conservação, recursos hídricos, uso do solo, comunidades e sobreposições que alteram o caminho do licenciamento.</p><div className="territory-stats"><div><strong>01</strong><span>mapa de contexto</span></div><div><strong>∞</strong><span>camadas combináveis</span></div><div><strong>360°</strong><span>visão do projeto</span></div></div><Link className="arrow-link" href="/piloto-telecom">Conectar meu contexto territorial <ArrowRight size={16} /></Link></div>
        </section>

        <section className="governance-section" id="governanca" aria-labelledby="governance-title">
          <div className="section-number section-number--dark">02 <span>Governança</span></div>
          <div className="governance-grid"><div><p className="eyebrow">IA com responsabilidade</p><h2 id="governance-title">Velocidade para a triagem. <em>Critério para a decisão.</em></h2></div><div className="governance-copy"><p>A IA organiza documentos, sugere campos e aponta divergências. A equipe técnica revisa, aprova e mantém o contexto. Assim, automação não vira caixa-preta: cada resultado carrega fonte, confiança e responsável.</p><div className="governance-card"><div className="governance-card__icon"><Sparkles size={19} /></div><div><strong>Uma resposta nunca vem sozinha.</strong><p>Ela vem com evidência, versão e próxima ação.</p></div><span className="verified-pill"><Check size={13} /> auditável</span></div></div></div>
        </section>

        <section className="cta-section" id="contato" aria-labelledby="cta-title"><div className="cta-map" aria-hidden="true" /><div className="cta-inner"><div className="cta-evidence"><div className="cta-evidence__top"><span>Próxima decisão</span><span>04 / 04</span></div><div className="cta-evidence__line"><span className="cta-evidence__marker"><Check size={14} /></span><div><strong>Contexto pronto para revisão</strong><small>Fontes, responsáveis e próximos passos conectados.</small></div></div><div className="cta-evidence__footer"><span className="verified-pill"><Check size={13} /> evidência verificada</span><ArrowRight size={15} /></div></div><div className="cta-copy"><p className="eyebrow eyebrow--light">O próximo passo começa no contexto certo</p><h2 id="cta-title">Pronto para deixar a conformidade mais inteligente?</h2><p>Comece configurando o seu espaço de trabalho, depois transforme uma rotina real em um piloto com dados rastreáveis.</p><button className="button button--mint" type="button" onClick={() => setLocation("/piloto-telecom")}>Planejar meu piloto <ArrowRight size={17} /></button></div></div></section>
      </main>

      <footer className="site-footer"><AppLogo compact /><p>Inteligência para decisões ambientais mais confiáveis.</p><div className="footer-meta"><span>© 2026 Regularizando</span><span>Feito para EHS, ESG e engenharia ambiental</span></div></footer>

      {demoOpen && <div className="modal-backdrop" role="presentation" onClick={() => setDemoOpen(false)}><div className="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Fechar demonstração" onClick={() => setDemoOpen(false)}><X size={18} /></button><div className="modal-icon"><Radar size={20} /></div><p className="eyebrow">Demonstração guiada</p><h2 id="demo-title">Veja o Regularizando pensando junto com sua equipe.</h2><p>O caminho agora é direto: entre no dashboard, crie sua organização e cadastre o primeiro ativo ou licença.</p><button className="button button--nav button--full" type="button" onClick={() => { setDemoOpen(false); setLocation("/dashboard"); }}>Acessar o dashboard <ArrowRight size={16} /></button><button className="modal-secondary" type="button" onClick={() => setDemoOpen(false)}>Continuar explorando o site</button></div></div>}
    </div>
  );
}
