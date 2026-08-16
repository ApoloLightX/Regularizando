import MarketingFooter from "@/components/MarketingFooter";
import MarketingNav from "@/components/MarketingNav";
import { ArrowRight, CheckCircle2, FileCheck2, FileUp, LineChart, MapPinned, Radar, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Link } from "wouter";

const tour = [
  { number: "01", icon: FileUp, title: "Traga o que a equipe já possui.", body: "Licenças, planilhas, PDFs, DOCX, XLSX, CSV e imagens permitidas entram como evidências com metadados. Arquivos passam por validação estrutural e quarentena; autorização para processamento ou download continua humana." },
  { number: "02", icon: Radar, title: "Estruture a obrigação com a origem preservada.", body: "Fontes, versões, artigo, item ou página, critérios de aplicabilidade e evidência esperada podem ser registrados no fluxo de obrigações. Aplicabilidade pendente não vira conclusão automática." },
  { number: "03", icon: UserRoundCheck, title: "Distribua a próxima ação certa.", body: "Prazo, responsável e estado de revisão conectam a pendência ao ativo. A plataforma mantém os papéis de visualização, análise, revisão e administração separados por organização." },
  { number: "04", icon: FileCheck2, title: "Comprove antes de encerrar.", body: "Uma evidência só sustenta uma decisão depois da revisão humana aplicável. O histórico liga fonte, requisito, evidência e decisão sem tratar um documento como prova suficiente por si só." },
];

const modules = [
  { icon: Radar, title: "Licenciamento & obrigações", body: "Licenças, condicionantes, requisitos, vigências e prazos são o núcleo da rotina." },
  { icon: FileCheck2, title: "Evidências e revisão", body: "Quarentena, integridade, autorizações e revisão humana antes de disponibilidade operacional." },
  { icon: ShieldCheck, title: "Operação e não conformidades", body: "Inspeções, incidentes e planos de ação podem seguir a mesma cadeia de responsável e prazo." },
  { icon: LineChart, title: "Indicadores ambientais e ESG", body: "Métricas preservam período, unidade, fonte, meta e estado de revisão." },
  { icon: MapPinned, title: "Território e GIS", body: "Contexto territorial entra apenas com localização, fonte e data reais do ativo." },
];

const capabilities = [
  ["Entrada atual", "Evidências em formatos permitidos, registros de ativos, fontes e requisitos estruturados."],
  ["Validação humana", "Revisão e decisão são etapas humanas; IA futura não recebe autoridade para concluir obrigações."],
  ["Versionamento", "Fontes, versões de requisitos e políticas de retenção preservam histórico no modelo atual."],
  ["Aprovação", "Perfis e autorizações protegem revisão de evidência e ações de organização."],
  ["Integrações", "Nenhuma integração externa de cliente é declarada nesta página. O escopo é confirmado no piloto."],
  ["Exportação", "Exportações, formatos e critérios de entrega são definidos com o parceiro antes de dados reais."],
];

const maturity = [
  { state: "Implementado", title: "Controles e cadeia verificável", body: "O modelo já preserva fontes e versões, requisitos, responsáveis, evidências em quarentena, revisão humana, papéis por organização e registros de auditoria." },
  { state: "Piloto", title: "Aplicação em dados autorizados", body: "A validação com ativos, documentos e rotinas de uma organização parceira depende de escopo, autorizações, contrato e revisão técnica definidos com esse parceiro." },
  { state: "Roadmap", title: "Integrações e expansões por contexto", body: "Integrações externas, migrações amplas, novos módulos e critérios de entrega só entram depois de uma decisão de produto e de uma validação adequada; não são prometidos nesta página." },
];

export default function Product() {
  return <div className="marketing-page product-page"><MarketingNav /><main><section className="page-hero page-hero--product"><p className="eyebrow">Licenciamento e obrigações primeiro</p><h1>Veja como uma obrigação chega à <em>decisão verificável.</em></h1><p>O Regularizando começa organizando licenças, condicionantes, documentos e responsáveis. Depois, operação, indicadores ambientais e território ampliam o contexto da mesma rotina — sem perder origem, papel ou revisão.</p><div className="product-hero__actions"><Link href="/demonstracao" className="button button--mint">Ver demonstração guiada <ArrowRight size={16} /></Link><Link href="/contato" className="arrow-link arrow-link--light">Planejar um piloto <ArrowRight size={16} /></Link></div></section><section className="product-capabilities" aria-labelledby="product-capabilities-title"><div><p className="eyebrow">O que existe hoje</p><h2 id="product-capabilities-title">Uma visão honesta antes de qualquer implantação.</h2><p>Esta página descreve os controles e fluxos disponíveis no produto. Não apresenta integração, precisão de extração, prazo de implantação ou resultado de cliente que não tenha sido acordado e validado.</p></div><dl>{capabilities.map(([term, description]) => <div key={term}><dt>{term}</dt><dd>{description}</dd></div>)}</dl></section><section className="product-maturity" aria-labelledby="product-maturity-title"><div><p className="eyebrow eyebrow--light">O que funciona hoje</p><h2 id="product-maturity-title">Maturidade declarada, sem confundir código com resultado de cliente.</h2><p>A classificação abaixo é uma fronteira comercial: mostra o que está implementado no produto, o que só pode ser validado em um parceiro e o que continua futuro.</p></div><ol>{maturity.map((item) => <li key={item.state}><span className={`maturity-state maturity-state--${item.state.toLowerCase()}`}>{item.state}</span><h3>{item.title}</h3><p>{item.body}</p></li>)}</ol></section><section className="product-tour" aria-labelledby="product-tour-title"><div className="product-tour__heading"><p className="eyebrow">Visita guiada</p><h2 id="product-tour-title">Da entrada ao fechamento, sem caixa-preta.</h2><p>O fluxo abaixo mostra o que a equipe faz e onde o controle humano continua necessário.</p></div><ol>{tour.map((step) => { const Icon = step.icon; return <li key={step.number}><span>{step.number}</span><Icon size={22} /><h3>{step.title}</h3><p>{step.body}</p></li>; })}</ol><div className="product-tour__footer"><span><CheckCircle2 size={16} /> Fonte → requisito → prazo → responsável → evidência → revisão → decisão.</span><Link className="arrow-link" href="/demonstracao">Percorrer o fluxo ilustrativo <ArrowRight size={16} /></Link></div></section><section className="product-modules" aria-labelledby="product-modules-title"><div className="product-modules__intro"><p className="eyebrow eyebrow--light">Expansões da mesma fonte de verdade</p><h2 id="product-modules-title">Licenciamento é o núcleo. Os demais módulos entram quando ajudam a rotina.</h2></div><div>{modules.map((module, index) => { const Icon = module.icon; return <article key={module.title}><span>0{index + 1}</span><Icon size={24} /><h3>{module.title}</h3><p>{module.body}</p></article>; })}</div></section><section className="product-next"><div><p className="eyebrow">Próximo passo</p><h2>Não comece por uma migração total.</h2></div><div><p>Escolha uma rotina que já gera risco ou retrabalho. No piloto, a equipe valida as entradas disponíveis, o conjunto aplicável, quem revisa e como o resultado será medido antes de discutir expansão.</p><Link href="/piloto-telecom" className="button button--ink">Conhecer o piloto telecom <ArrowRight size={16} /></Link></div></section></main><MarketingFooter /></div>;
}
