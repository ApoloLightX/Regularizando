import MarketingNav from "@/components/MarketingNav";
import { ArrowRight, CheckCircle2, CircleDot, MapPinned, ShieldCheck, TowerControl } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useLocation } from "wouter";

const phases = [{ title: "Definir o recorte", body: "Selecionar uma região, conjunto de sites ou família de obrigações que represente uma dor relevante e seja viável de validar." }, { title: "Mapear o dado existente", body: "Organizar fontes, responsáveis, licenças, condicionantes e evidências já disponíveis, sem prometer uma base perfeita no primeiro dia." }, { title: "Configurar o fluxo", body: "Criar sites, regras de acompanhamento, CAPAs, métricas ESG e pontos de aprovação compatíveis com a operação." }, { title: "Rodar e revisar", body: "Usar o painel em uma rotina real, revisar exceções com a equipe e ajustar critérios antes da expansão." }];

export default function PilotTelecom() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const begin = () => { if (isAuthenticated) setLocation("/dashboard"); else startLogin(); };
  return <div className="marketing-page"><MarketingNav /><main><section className="pilot-hero"><div><p className="eyebrow">Piloto para telecom e infraestrutura</p><h1>Do site isolado ao portfólio <em>governável.</em></h1><p>Um piloto bem desenhado não tenta automatizar toda a empresa. Ele comprova, com dados reais, que a rotina de conformidade pode ser melhor antes de escalar.</p><button className="button button--mint" type="button" onClick={begin}>Iniciar espaço de trabalho <ArrowRight size={16} /></button></div><aside><span className="status-chip status-chip--verified"><CheckCircle2 size={13} /> Modo concierge</span><h2>O que será validado</h2><p>Prontidão de licença, cobertura de evidências, gestão de CAPA e qualidade de um indicador ESG prioritário.</p><div><MapPinned size={18} /><span>Um recorte territorial real</span></div><div><ShieldCheck size={18} /><span>Aprovação humana em decisões críticas</span></div><div><TowerControl size={18} /><span>Modelo para operação distribuída</span></div></aside></section><section className="pilot-phases"><div><p className="eyebrow">Quatro etapas</p><h2>Uma expansão só é segura quando o primeiro fluxo funciona.</h2></div><div>{phases.map((phase, index) => <article key={phase.title}><span><CircleDot size={15} /> 0{index + 1}</span><h3>{phase.title}</h3><p>{phase.body}</p></article>)}</div></section></main></div>;
}
