import { ArrowLeft, Check } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";

type Concept = {
  number: string;
  name: string;
  principle: string;
  rationale: string;
  risks: string;
  symbol: ReactNode;
};

function DecisionNode() {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 120 120"><path d="M18 25h33c10 0 17 7 17 17v9M18 60h28c13 0 22 9 22 22v13M18 95h33c10 0 17-7 17-17v-9" stroke="currentColor" strokeLinecap="round" strokeWidth="10"/><circle cx="86" cy="60" fill="currentColor" r="12"/></svg>;
}

function LayeredRecord() {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 120 120"><path d="M22 31c16-9 31-9 46 0l20 12M22 60c16-9 31-9 46 0l20 12M22 89c16-9 31-9 46 0l20-12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10"/><circle cx="95" cy="43" fill="currentColor" r="8"/></svg>;
}

function PreciseTrace() {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 120 120"><path d="M23 91c22 0 25-49 45-49 13 0 14 21 28 21h6" stroke="currentColor" strokeLinecap="round" strokeWidth="11"/><path d="M23 30h28" stroke="currentColor" strokeLinecap="round" strokeWidth="11"/><circle cx="96" cy="63" fill="currentColor" r="11"/></svg>;
}

const concepts: Concept[] = [
  {
    number: "01",
    name: "Nó de decisão",
    principle: "A informação dispersa converge em uma decisão rastreável.",
    rationale: "Três entradas organizadas chegam a um ponto de referência. É a direção mais próxima da tese de produto e a mais forte para um ícone de aplicativo.",
    risks: "Precisa de refinamento para não parecer diagrama de fluxo ou conexão de rede.",
    symbol: <DecisionNode />,
  },
  {
    number: "02",
    name: "Registro em camadas",
    principle: "Versões, evidências e contexto permanecem legíveis em conjunto.",
    rationale: "Faixas abertas sugerem camadas de registro e território sem usar documento, folha ou mapa literal. É a direção mais institucional e editorial.",
    risks: "Precisa de uma silhueta mais distinta para não se tornar um símbolo abstrato demais.",
    symbol: <LayeredRecord />,
  },
  {
    number: "03",
    name: "Rastro preciso",
    principle: "Cada decisão permite voltar ao ponto que a sustenta.",
    rationale: "Um percurso controlado chega ao nó final. É a direção mais humana e memorável, com boa leitura em espaços horizontais.",
    risks: "Precisa evitar qualquer aparência de rota, geolocalização ou pulso de monitoramento.",
    symbol: <PreciseTrace />,
  },
];

export default function BrandDirections() {
  return <main className="brand-directions" aria-labelledby="brand-directions-title">
    <header className="brand-directions__header">
      <Link href="/" className="brand-directions__back"><ArrowLeft size={16} /> Voltar à prévia</Link>
      <span>Direção interna · não indexar</span>
    </header>
    <section className="brand-directions__intro">
      <p className="eyebrow"><span className="eyebrow-dot" /> Regularizando · estudo de marca</p>
      <h1 id="brand-directions-title">Uma marca que permanece clara quando a interface fica pequena.</h1>
      <p>O símbolo anterior foi descartado porque parecia uma moldura genérica e perdia leitura. Estas direções são estudos vetoriais, ainda não são a marca oficial e não alteram a proposta de valor do produto.</p>
    </section>
    <section className="brand-directions__grid" aria-label="Direções de marca em avaliação">
      {concepts.map((concept) => <article className="brand-direction-card" key={concept.number}>
        <div className="brand-direction-card__top"><span>{concept.number}</span><span>Estudo vetorial</span></div>
        <div className="brand-direction-card__symbol">{concept.symbol}</div>
        <div className="brand-direction-card__wordmark"><strong>regularizando</strong><span>{concept.name}</span></div>
        <p className="brand-direction-card__principle">{concept.principle}</p>
        <dl><div><dt>Por que pode funcionar</dt><dd>{concept.rationale}</dd></div><div><dt>Atenção no refinamento</dt><dd>{concept.risks}</dd></div></dl>
      </article>)}
    </section>
    <section className="brand-directions__criteria" aria-label="Critérios de aceite da marca">
      <h2>O que precisa sobreviver ao refinamento</h2>
      <div><span><Check size={15} /> Legibilidade em 16 px</span><span><Check size={15} /> Versão monocromática</span><span><Check size={15} /> Sem microtexto</span><span><Check size={15} /> Sem selo ou alegação visual</span></div>
    </section>
  </main>;
}
