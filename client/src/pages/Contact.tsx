import MarketingNav from "@/components/MarketingNav";
import { ArrowRight, CheckCircle2, ClipboardCheck, MapPinned } from "lucide-react";
import { Link } from "wouter";

export default function Contact() {
  return <div className="marketing-page"><MarketingNav /><main><section className="contact-hero"><div><p className="eyebrow">Planeje o primeiro fluxo</p><h1>Comece pelo risco que sua equipe precisa <em>enxergar agora.</em></h1><p>O Regularizando foi desenhado para começar com um recorte concreto, documentar decisões e evoluir com a operação. Acesse o piloto para criar o espaço de trabalho e configurar seu primeiro cenário.</p><Link href="/piloto-telecom" className="button button--mint">Planejar piloto <ArrowRight size={16} /></Link></div><aside><span className="kicker">O primeiro encontro precisa definir</span><div><MapPinned size={17} /><span>Qual ativo, região ou obrigação será priorizado</span></div><div><ClipboardCheck size={17} /><span>Quais registros e evidências já existem</span></div><div><CheckCircle2 size={17} /><span>Quem revisa e aprova cada decisão crítica</span></div></aside></section></main></div>;
}
