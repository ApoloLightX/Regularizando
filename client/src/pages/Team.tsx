import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Copy, Link2, MailPlus, ShieldCheck, UserCog, UsersRound, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";

const roleLabel: Record<string, string> = { owner: "Proprietário", admin: "Administrador", analyst: "Analista", reviewer: "Revisor", viewer: "Leitor" };

export default function Team() {
  const dashboard = trpc.dashboard.overview.useQuery();
  const utils = trpc.useUtils();
  const team = trpc.team.members.useQuery(undefined, { enabled: Boolean(dashboard.data?.organization) });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "analyst" | "reviewer" | "viewer">("analyst");
  const [latestLink, setLatestLink] = useState("");
  const [copyState, setCopyState] = useState("");
  const createInvite = trpc.team.createInvite.useMutation({ onSuccess: () => void team.refetch() });
  const revokeInvite = trpc.team.revokeInvite.useMutation({ onSuccess: () => void team.refetch() });
  const assignCapa = trpc.capa.assignResponsible.useMutation({ onSuccess: () => void utils.dashboard.overview.invalidate() });
  const assignReview = trpc.reviews.assignResponsible.useMutation({ onSuccess: () => void utils.dashboard.overview.invalidate() });

  const membership = dashboard.data?.membership;
  const isManager = membership?.role === "owner" || membership?.role === "admin";
  const data = dashboard.data?.data;
  const members = team.data?.members ?? [];
  const reviewerMembers = useMemo(() => members.filter((member) => ["owner", "admin", "reviewer"].includes(member.membership.role)), [members]);

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await createInvite.mutateAsync({ email, role, origin: window.location.origin });
    setLatestLink(response.invitationUrl);
    setEmail("");
    setCopyState("Link criado. Copie e envie pelo canal aprovado pela sua organização.");
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(latestLink);
      setCopyState("Link copiado para a área de transferência.");
    } catch {
      setCopyState("Copie o link manualmente no campo abaixo.");
    }
  }

  if (dashboard.isLoading) return <DashboardLayout><div className="dashboard-loading">Carregando equipe…</div></DashboardLayout>;
  if (!dashboard.data?.organization) return <DashboardLayout><section className="dashboard-card team-empty"><UsersRound size={28} /><h1>Crie um espaço de trabalho antes de convidar a equipe.</h1><p>Os convites, os papéis e as atribuições são sempre vinculados a uma organização.</p><Link href="/dashboard" className="button button--dark">Criar espaço de trabalho</Link></section></DashboardLayout>;

  return <DashboardLayout><div className="team-page"><header className="dashboard-page__header"><div><p className="kicker">Acesso, responsabilidade e rastreabilidade</p><h1>Equipe e convites</h1><p className="dashboard-subtitle">Convide pessoas por e-mail, defina o papel de acesso e atribua responsáveis a ações corretivas e revisões pendentes.</p></div><span className="status-chip status-chip--verified"><ShieldCheck size={13} /> {members.length} membros ativos</span></header>

    <section className="team-grid"><article className="dashboard-card team-members"><div className="card-heading"><div><span className="kicker">Membros da organização</span><h2>Quem atua no fluxo</h2></div></div>{members.length === 0 ? <p className="empty-copy">Os membros aparecerão depois que o primeiro convite for aceito.</p> : <div className="member-list">{members.map((member) => <div className="member-row" key={member.membership.id}><span className="member-avatar">{member.user.name?.charAt(0).toUpperCase() || member.user.email?.charAt(0).toUpperCase() || "M"}</span><div><strong>{member.user.name || "Membro sem nome"}</strong><small>{member.user.email || "E-mail não informado"}</small></div><span className={`role-badge role-badge--${member.membership.role}`}>{roleLabel[member.membership.role]}</span></div>)}</div>}</article>
      <article className="invite-card"><span className="kicker">Convites seguros</span><MailPlus size={25} /><h2>Amplie a equipe com contexto.</h2><p>O link tem validade de 7 dias, é associado ao e-mail informado e só funciona uma vez.</p>{isManager ? <form onSubmit={createInvitation}><label>E-mail do convidado<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@empresa.com" /></label><label>Papel de acesso<select value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="analyst">Analista · registra e acompanha</option><option value="reviewer">Revisor · valida evidências</option><option value="viewer">Leitor · apenas visualiza</option><option value="admin">Administrador · gerencia equipe</option></select></label>{createInvite.error && <p className="form-error">{createInvite.error.message}</p>}<button className="button button--mint" type="submit" disabled={createInvite.isPending}>{createInvite.isPending ? "Criando…" : "Gerar convite"} <Link2 size={15} /></button></form> : <div className="permission-note"><ShieldCheck size={16} /> Apenas proprietários e administradores podem criar convites.</div>}</article></section>

    {latestLink && <section className="invite-link-panel"><div><span className="kicker">Convite pronto</span><strong>Envie o link pela ferramenta aprovada da empresa.</strong><p>{copyState}</p></div><div className="invite-link-panel__field"><input readOnly value={latestLink} aria-label="Link do convite" /><button type="button" className="button button--dark button--small" onClick={() => void copyInviteLink()}><Copy size={14} /> Copiar</button></div><button type="button" className="invite-link-close" aria-label="Fechar link" onClick={() => { setLatestLink(""); setCopyState(""); }}><X size={17} /></button></section>}

    <section className="dashboard-card pending-invites"><div className="card-heading"><div><span className="kicker">Acompanhamento</span><h2>Convites pendentes</h2></div><span className="status-chip status-chip--pendente">{team.data?.invites.filter((invite) => invite.status === "pendente").length ?? 0} aguardando</span></div>{(team.data?.invites.filter((invite) => invite.status === "pendente").length ?? 0) === 0 ? <div className="empty-state"><span><MailPlus size={21} /></span><div><strong>Sem convites pendentes</strong><p>Os próximos convites criados aparecerão aqui com função e validade.</p></div></div> : <div className="compact-list">{team.data?.invites.filter((invite) => invite.status === "pendente").map((invite) => <div className="compact-list__row" key={invite.id}><span className="evidence-file"><MailPlus size={16} /></span><div><strong>{invite.email}</strong><small>{roleLabel[invite.role]} · expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}</small></div><span className="row-status">pendente</span>{isManager && <button className="decision-button decision-button--reject" type="button" aria-label="Revogar convite" disabled={revokeInvite.isPending} onClick={() => void revokeInvite.mutateAsync({ inviteId: invite.id })}><X size={14} /></button>}</div>)}</div>}</section>

    <section className="responsibility-section"><div className="section-heading-inline"><div><p className="kicker">Delegação operacional</p><h2>Responsáveis específicos</h2></div><p>Uma atribuição fica vinculada ao membro real da organização, não apenas a um nome em texto.</p></div><div className="responsibility-grid"><article className="dashboard-card"><div className="card-heading"><div><span className="kicker">Ações corretivas</span><h2>CAPAs abertas</h2></div><UserCog size={20} /></div>{(data?.capas.filter((capa) => capa.status !== "concluida").length ?? 0) === 0 ? <p className="empty-copy">Não há CAPAs abertas para atribuir.</p> : <div className="assignment-list">{data?.capas.filter((capa) => capa.status !== "concluida").map((capa) => <div className="assignment-row" key={capa.id}><div><strong>{capa.title}</strong><small>Prioridade {capa.priority} · {capa.status.replaceAll("_", " ")}</small></div><select aria-label={`Responsável pela CAPA ${capa.title}`} value={capa.responsibleUserId ?? ""} disabled={!isManager || assignCapa.isPending} onChange={(event) => void assignCapa.mutateAsync({ capaId: capa.id, responsibleUserId: event.target.value ? Number(event.target.value) : null })}><option value="">Sem responsável</option>{members.map((member) => <option value={member.user.id} key={member.user.id}>{member.user.name || member.user.email} · {roleLabel[member.membership.role]}</option>)}</select></div>)}</div>}</article>
        <article className="dashboard-card"><div className="card-heading"><div><span className="kicker">Revisão humana</span><h2>Aprovações pendentes</h2></div><CheckCircle2 size={20} /></div>{(data?.reviewRequests.filter((review) => review.status === "pendente").length ?? 0) === 0 ? <p className="empty-copy">Não há evidências aguardando uma decisão.</p> : <div className="assignment-list">{data?.reviewRequests.filter((review) => review.status === "pendente").map((review) => { const evidence = data.evidences.find((item) => item.id === review.evidenceId); return <div className="assignment-row" key={review.id}><div><strong>{evidence?.fileName || `Evidência #${review.evidenceId}`}</strong><small>Solicitação #{review.id} · aguardando revisão</small></div><select aria-label={`Responsável pela aprovação ${review.id}`} value={review.reviewerUserId ?? ""} disabled={!isManager || assignReview.isPending} onChange={(event) => void assignReview.mutateAsync({ reviewId: review.id, reviewerUserId: event.target.value ? Number(event.target.value) : null })}><option value="">Sem revisor definido</option>{reviewerMembers.map((member) => <option value={member.user.id} key={member.user.id}>{member.user.name || member.user.email} · {roleLabel[member.membership.role]}</option>)}</select></div>; })}</div>}</article></div></section>
  </div></DashboardLayout>;
}
