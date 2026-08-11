import MarketingNav from "@/components/MarketingNav";
import { ArrowRight, CheckCircle2, FileCheck2, Globe2, Radar, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const layers = [{ icon: Radar, title: "Radar regulatório", body: "Requisitos, competência, licenças, validade e condicionantes organizados por ativo e território." }, { icon: ShieldCheck, title: "Operação EHS", body: "Incidentes, inspeções, CAPA e ações responsáveis por prazo em uma única linha do tempo." }, { icon: FileCheck2, title: "Evidências", body: "Arquivos seguros, metadados, status de revisão e ligação direta com o registro que precisam comprovar." }, { icon: Globe2, title: "ESG e território", body: "Indicadores com fonte e meta, conectados ao contexto territorial da operação e a decisões de gestão." }];

export default function Product() {
  return <div className="marketing-page"><MarketingNav /><main><section className="page-hero page-hero--product"><p className="eyebrow">Uma base para a operação inteira</p><h1>Conformidade não é uma pasta. É um <em>sistema vivo.</em></h1><p>O Regularizando conecta processos ambientais, segurança operacional e dados ESG de forma rastreável, com revisão humana para as decisões que importam.</p><Link href="/dashboard" className="button button--mint">Acessar dashboard <ArrowRight size={16} /></Link></section><section className="product-grid">{layers.map((layer, index) => { const Icon = layer.icon; return <article key={layer.title}><span>0{index + 1}</span><Icon size={25} /><h2>{layer.title}</h2><p>{layer.body}</p><CheckCircle2 size={16} /></article>; })}</section></main></div>;
}
