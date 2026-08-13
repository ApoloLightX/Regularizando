import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, ContactRound, ShieldAlert } from "lucide-react";

const stageLabel: Record<string, string> = {
  captured: "Capturado",
  mql: "MQL",
  sql: "SQL",
  disqualified: "Descartado",
  converted: "Convertido",
};

const originLabel: Record<string, string> = {
  website: "Site",
  referral: "Indicação",
  event: "Evento",
  partner: "Parceiro",
  outbound: "Prospecção",
  other: "Outro",
};

export default function Leads() {
  const leads = trpc.leads.list.useQuery();
  const utils = trpc.useUtils();
  const qualify = trpc.leads.qualify.useMutation({ onSuccess: () => void utils.leads.list.invalidate() });

  if (leads.isLoading) return <DashboardLayout><div className="dashboard-loading">Carregando solicitações de piloto…</div></DashboardLayout>;
  if (leads.error) return <DashboardLayout><section className="dashboard-card team-empty"><ShieldAlert size={28} /><h1>Área restrita à administração do produto.</h1><p>Solicitações de piloto podem conter dados de contato e só são acessíveis a administradores globais autorizados.</p></section></DashboardLayout>;

  return <DashboardLayout><div className="team-page">
    <header className="dashboard-page__header"><div><p className="kicker">Captação consentida e acesso restrito</p><h1>Leads e solicitações de piloto</h1><p className="dashboard-subtitle">Acompanhe a origem e o estágio de qualificação sem replicar dados pessoais na trilha externa de governança.</p></div><span className="status-chip status-chip--verified"><BadgeCheck size={13} /> {leads.data?.length ?? 0} registros</span></header>
    <section className="dashboard-card pending-invites"><div className="card-heading"><div><span className="kicker">Funil inicial</span><h2>Solicitações recebidas</h2></div><span className="row-status">administração</span></div>{(leads.data?.length ?? 0) === 0 ? <div className="empty-state"><span><ContactRound size={21} /></span><div><strong>Nenhuma solicitação de piloto ainda.</strong><p>Novos contatos consentidos enviados pelo site aparecerão aqui com origem “Site” e estágio “Capturado”.</p></div></div> : <div className="assignment-list">{leads.data?.map(lead => <div className="assignment-row" key={lead.id}><div><strong>{lead.company}</strong><small>{lead.name} · {lead.email} · origem: {originLabel[lead.leadOrigin] ?? lead.leadOrigin} · recebido em {new Date(lead.createdAt).toLocaleDateString("pt-BR")}</small></div><select aria-label={`Estágio do lead ${lead.company}`} value={lead.qualificationStage} disabled={qualify.isPending || ["disqualified", "converted"].includes(lead.qualificationStage)} onChange={event => void qualify.mutateAsync({ pilotRequestId: lead.id, qualificationStage: event.target.value as "mql" | "sql" | "disqualified" | "converted" })}><option value="captured">Capturado</option><option value="mql">MQL</option><option value="sql">SQL</option><option value="disqualified">Descartado</option><option value="converted">Convertido</option></select><span className="role-badge role-badge--viewer">{stageLabel[lead.qualificationStage]}</span></div>)}</div>}</section>
  </div></DashboardLayout>;
}
