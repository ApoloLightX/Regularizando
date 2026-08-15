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

const privacyTypeLabel: Record<string, string> = {
  acesso: "Acesso", confirmacao_tratamento: "Confirmação de tratamento", correcao: "Correção", exportacao: "Exportação", eliminacao: "Exclusão", anonimizacao: "Anonimização", oposicao: "Oposição", duvida: "Dúvida",
};

export default function Leads() {
  const leads = trpc.leads.list.useQuery();
  const utils = trpc.useUtils();
  const qualify = trpc.leads.qualify.useMutation({ onSuccess: () => void utils.leads.list.invalidate() });

  if (leads.isLoading) return <DashboardLayout><div className="dashboard-loading">Carregando contatos recebidos…</div></DashboardLayout>;
  if (leads.error) return <DashboardLayout><section className="dashboard-card team-empty"><ShieldAlert size={28} /><h1>Área restrita à administração do produto.</h1><p>Solicitações de piloto e de privacidade podem conter dados de contato e só são acessíveis a administradores globais autorizados.</p></section></DashboardLayout>;

  return <DashboardLayout><div className="team-page">
    <header className="dashboard-page__header"><div><p className="kicker">Captação consentida e acesso restrito</p><h1>Leads e contatos de privacidade</h1><p className="dashboard-subtitle">Acompanhe contatos comerciais sem classificar pedidos de privacidade como lead. A trilha externa recebe apenas metadados minimizados.</p></div><span className="status-chip status-chip--verified"><BadgeCheck size={13} /> {leads.data?.length ?? 0} registros</span></header>
    <section className="dashboard-card pending-invites"><div className="card-heading"><div><span className="kicker">Entrada pública</span><h2>Solicitações recebidas</h2></div><span className="row-status">administração</span></div>{(leads.data?.length ?? 0) === 0 ? <div className="empty-state"><span><ContactRound size={21} /></span><div><strong>Nenhum contato recebido ainda.</strong><p>Solicitações de piloto e pedidos de privacidade enviados pelo site aparecerão aqui de forma separada.</p></div></div> : <div className="assignment-list">{leads.data?.map(lead => lead.requestCategory === "privacy" ? <div className="assignment-row" key={lead.id}><div><strong>Pedido de privacidade · {privacyTypeLabel[lead.privacyRequestType ?? "duvida"]}</strong><small>{lead.name} · {lead.email} · recebido em {new Date(lead.createdAt).toLocaleDateString("pt-BR")}</small><small>Encaminhe para análise humana no fluxo LGPD; não qualifique este registro como lead comercial.</small></div><span className="role-badge role-badge--viewer">Privacidade</span></div> : <div className="assignment-row" key={lead.id}><div><strong>{lead.company || "Empresa não informada"}</strong><small>{lead.name} · {lead.email} · origem: {originLabel[lead.leadOrigin] ?? lead.leadOrigin} · recebido em {new Date(lead.createdAt).toLocaleDateString("pt-BR")}</small></div><select aria-label={`Estágio do lead ${lead.company || lead.id}`} value={lead.qualificationStage} disabled={qualify.isPending || ["disqualified", "converted"].includes(lead.qualificationStage)} onChange={event => void qualify.mutateAsync({ pilotRequestId: lead.id, qualificationStage: event.target.value as "mql" | "sql" | "disqualified" | "converted" })}><option value="captured">Capturado</option><option value="mql">MQL</option><option value="sql">SQL</option><option value="disqualified">Descartado</option><option value="converted">Convertido</option></select><span className="role-badge role-badge--viewer">{stageLabel[lead.qualificationStage]}</span></div>)}</div>}</section>
  </div></DashboardLayout>;
}
