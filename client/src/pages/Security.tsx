import MarketingNav from "@/components/MarketingNav";
import { ArrowRight, CheckCircle2, FileCheck2, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "wouter";

const controls = [
  { icon: UsersRound, title: "Separação por organização", body: "Os registros operacionais são vinculados a uma organização. As APIs validam o pertencimento antes de criar vínculos entre ativos, licenças, CAPAs, evidências e indicadores." },
  { icon: LockKeyhole, title: "Acesso por papel", body: "Administradores, analistas, revisores e leitores possuem responsabilidades distintas. Convites têm uso único, prazo e vínculo ao e-mail autenticado." },
  { icon: FileCheck2, title: "Evidência com revisão", body: "Arquivos são guardados fora do banco de dados, com metadados, vínculo operacional, status e fila de aprovação humana." },
  { icon: ShieldCheck, title: "Decisão com responsável", body: "CAPAs e aprovações podem receber responsáveis específicos. Uma revisão atribuída somente pode ser concluída pelo revisor designado." },
];

export default function Security() {
  return <div className="marketing-page security-page"><MarketingNav /><main><section className="security-hero"><p className="eyebrow">Segurança e governança</p><h1>Dados ambientais exigem controle, <em>não promessas vagas.</em></h1><p>O Regularizando foi projetado para manter pessoas, evidências e decisões conectadas. Esta página apresenta somente controles que já fazem parte da plataforma atual.</p><Link className="button button--mint" href="/contato">Solicitar piloto <ArrowRight size={16} /></Link></section><section className="security-controls"><div className="security-controls__intro"><p className="eyebrow">Controles disponíveis</p><h2>O que sua equipe consegue verificar hoje.</h2></div><div className="security-controls__grid">{controls.map(({ icon: Icon, title, body }) => <article key={title}><span><Icon size={20} /></span><h3>{title}</h3><p>{body}</p><small><CheckCircle2 size={13} /> Implementado na plataforma</small></article>)}</div></section><section className="security-transparency"><div><p className="eyebrow eyebrow--light">Transparência antes do piloto</p><h2>O que ainda precisa ser definido com cada organização.</h2></div><div><p>Política de retenção, rotinas de backup, integração com identidade corporativa, requisitos de LGPD e fluxos de exclusão devem ser acordados conforme o escopo do piloto e a governança do cliente.</p><p>O Regularizando não apresenta esses itens como certificações ou garantias genéricas enquanto não estiverem formalmente definidos e validados para a operação contratada.</p></div></section></main></div>;
}
