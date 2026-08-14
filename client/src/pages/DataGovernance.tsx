import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ClipboardList, FileDown, LockKeyhole, Plus, Scale, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const categories = ["evidencia", "lead", "auditoria", "conta", "operacional"] as const;
const requestTypes = ["acesso", "exportacao", "correcao", "eliminacao", "anonimizacao", "oposicao"] as const;
const requestStatuses = ["em_revisao", "aguardando_controlador", "atendida", "recusada", "cancelada"] as const;

const labels: Record<string, string> = {
  evidencia: "Evidências e anexos", lead: "Leads", auditoria: "Auditoria", conta: "Conta e identidade", operacional: "Dados operacionais",
  acesso: "Acesso", exportacao: "Exportação", correcao: "Correção", eliminacao: "Eliminação", anonimizacao: "Anonimização", oposicao: "Oposição",
  rascunho: "Rascunho", em_revisao: "Em revisão", ativa: "Ativa", aguardando_controlador: "Aguardando controlador", atendida: "Atendida", recusada: "Recusada", cancelada: "Cancelada",
  revisao_manual: "Revisão manual", anonimizacao_revisada: "Anonimização revisada", exclusao_revisada: "Exclusão revisada",
};

function statusClass(status: string) {
  if (["ativa", "atendida"].includes(status)) return "status-chip status-chip--verified";
  if (["recusada", "cancelada"].includes(status)) return "status-chip status-chip--vencida";
  return "status-chip status-chip--pendente";
}

export default function DataGovernance() {
  const utils = trpc.useUtils();
  const overview = trpc.dataGovernance.overview.useQuery();
  const setPolicy = trpc.dataGovernance.setRetentionPolicy.useMutation({ onSuccess: () => void utils.dataGovernance.overview.invalidate() });
  const createRequest = trpc.dataGovernance.createSubjectRequest.useMutation({ onSuccess: () => void utils.dataGovernance.overview.invalidate() });
  const handleRequest = trpc.dataGovernance.handleSubjectRequest.useMutation({ onSuccess: () => void utils.dataGovernance.overview.invalidate() });
  const recordRequestEvent = trpc.dataGovernance.recordSubjectRequestEvent.useMutation({ onSuccess: () => void utils.dataGovernance.overview.invalidate() });
  const [policyCategory, setPolicyCategory] = useState<(typeof categories)[number]>("evidencia");
  const [retentionDays, setRetentionDays] = useState("1825");
  const [legalBasisNote, setLegalBasisNote] = useState("");
  const [disposalMethod, setDisposalMethod] = useState<"revisao_manual" | "anonimizacao_revisada" | "exclusao_revisada">("revisao_manual");
  const [policyStatus, setPolicyStatus] = useState<"rascunho" | "em_revisao" | "ativa">("rascunho");
  const [subjectReference, setSubjectReference] = useState("");
  const [requestType, setRequestType] = useState<(typeof requestTypes)[number]>("acesso");
  const [scopeNote, setScopeNote] = useState("");
  const [decisionNotes, setDecisionNotes] = useState<Record<number, string>>({});
  const [requestStatusesById, setRequestStatusesById] = useState<Record<number, (typeof requestStatuses)[number]>>({});
  const [eventNotes, setEventNotes] = useState<Record<number, string>>({});
  const [evidenceReferences, setEvidenceReferences] = useState<Record<number, string>>({});

  async function savePolicy() {
    await setPolicy.mutateAsync({ dataCategory: policyCategory, retentionDays: retentionDays ? Number(retentionDays) : null, legalBasisNote, disposalMethod, status: policyStatus });
    setLegalBasisNote("");
  }

  async function submitSubjectRequest() {
    await createRequest.mutateAsync({ subjectReference, requestType, scopeNote });
    setSubjectReference(""); setScopeNote("");
  }

  async function decideRequest(requestId: number) {
    const status = requestStatusesById[requestId] ?? "em_revisao";
    await handleRequest.mutateAsync({ requestId, status, decisionRationale: decisionNotes[requestId] ?? "" });
  }

  async function recordEvidence(requestId: number) {
    await recordRequestEvent.mutateAsync({ requestId, eventType: "evidencia", evidenceReference: evidenceReferences[requestId] ?? undefined, note: eventNotes[requestId] ?? "" });
    setEventNotes((current) => ({ ...current, [requestId]: "" }));
    setEvidenceReferences((current) => ({ ...current, [requestId]: "" }));
  }

  const data = overview.data;
  return <DashboardLayout><div className="dashboard-page evidence-page">
    <header className="dashboard-page__header"><div><p className="kicker">Privacidade e governança operacional</p><h1>LGPD</h1><p className="dashboard-subtitle">Políticas, pedidos de titulares e decisões humanas. Referências de titulares são pseudonimizadas antes de persistir; o sistema não exclui dados automaticamente.</p></div><Link href="/dashboard" className="button button--outline">Voltar ao painel</Link></header>

    <section className="dashboard-card" aria-labelledby="lgpd-principles"><div className="card-heading"><div><span className="kicker">Regra de operação</span><h2 id="lgpd-principles">Nenhuma exclusão automática</h2></div><LockKeyhole size={22} aria-hidden="true" /></div><div className="grid gap-4 md:grid-cols-3 mt-4"><p><strong>Retenção registrada.</strong><br />Cada categoria recebe prazo, método e justificativa.</p><p><strong>Direitos sob revisão.</strong><br />Pedidos exigem decisão e justificativa humana.</p><p><strong>Trilha auditável.</strong><br />Criação e tratamento são registrados no log da organização.</p></div></section>

    {overview.isLoading ? <section className="dashboard-card"><p>Carregando registros de governança…</p></section> : <div className="grid gap-6 xl:grid-cols-2 mt-6">
      <section className="dashboard-card"><div className="card-heading"><div><span className="kicker">Retenção</span><h2>Política por categoria</h2></div><Scale size={21} aria-hidden="true" /></div><p className="dashboard-subtitle">Ativar uma política formaliza a aprovação atual; a execução de descarte continua dependente de revisão humana.</p>
        <div className="form-row mt-4"><label>Categoria<select value={policyCategory} onChange={(event) => setPolicyCategory(event.target.value as typeof policyCategory)}>{categories.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label><label>Prazo em dias <small>Vazio = revisão sem prazo automático</small><input value={retentionDays} inputMode="numeric" onChange={(event) => setRetentionDays(event.target.value.replace(/[^0-9]/g, ""))} /></label></div>
        <div className="form-row"><label>Método<select value={disposalMethod} onChange={(event) => setDisposalMethod(event.target.value as typeof disposalMethod)}><option value="revisao_manual">Revisão manual</option><option value="anonimizacao_revisada">Anonimização revisada</option><option value="exclusao_revisada">Exclusão revisada</option></select></label><label>Estado<select value={policyStatus} onChange={(event) => setPolicyStatus(event.target.value as typeof policyStatus)}><option value="rascunho">Rascunho</option><option value="em_revisao">Em revisão</option><option value="ativa">Ativa</option></select></label></div>
        <label>Base legal e justificativa<textarea value={legalBasisNote} onChange={(event) => setLegalBasisNote(event.target.value)} minLength={12} placeholder="Descreva a finalidade, fundamento e justificativa de retenção." /></label>
        {setPolicy.error ? <p className="form-error">{setPolicy.error.message}</p> : null}<button type="button" className="button button--dark mt-4" disabled={setPolicy.isPending || legalBasisNote.trim().length < 12} onClick={() => void savePolicy()}>{setPolicy.isPending ? "Salvando…" : "Registrar política"} <CheckCircle2 size={16} /></button>
        <div className="compact-list mt-6">{data?.policies.length ? data.policies.map((policy) => { const versions = data.policyVersions.filter((version) => version.policyId === policy.id); return <div className="compact-list__row" key={policy.id}><div><strong>{labels[policy.dataCategory]}</strong><small>{policy.retentionDays ? `${policy.retentionDays} dias` : "Sem prazo automático"} · {labels[policy.disposalMethod]} · {versions.length} versão(ões)</small>{versions[0] ? <small>Última versão: v{versions[0].versionNumber} em {new Date(versions[0].recordedAt).toLocaleDateString("pt-BR")}</small> : null}</div><span className={statusClass(policy.status)}>{labels[policy.status]}</span></div>; }) : <p className="text-sm text-muted-foreground">Nenhuma política registrada nesta organização.</p>}</div>
      </section>

      <section className="dashboard-card"><div className="card-heading"><div><span className="kicker">Direitos de titulares</span><h2>Novo pedido</h2></div><FileDown size={21} aria-hidden="true" /></div><p className="dashboard-subtitle">A referência é convertida em hash no servidor. Não cole documentos, credenciais ou dados sensíveis desnecessários neste campo.</p>
        <div className="form-row mt-4"><label>Referência do titular<input value={subjectReference} onChange={(event) => setSubjectReference(event.target.value)} placeholder="E-mail ou identificador interno" /></label><label>Tipo<select value={requestType} onChange={(event) => setRequestType(event.target.value as typeof requestType)}>{requestTypes.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label></div>
        <label>Escopo e contexto<textarea value={scopeNote} onChange={(event) => setScopeNote(event.target.value)} minLength={12} placeholder="Delimite o pedido e o que deverá ser analisado." /></label>
        {createRequest.error ? <p className="form-error">{createRequest.error.message}</p> : null}<button type="button" className="button button--dark mt-4" disabled={createRequest.isPending || subjectReference.trim().length < 3 || scopeNote.trim().length < 12} onClick={() => void submitSubjectRequest()}>{createRequest.isPending ? "Registrando…" : "Registrar pedido"} <Plus size={16} /></button>
      </section>
    </div>}

    <section className="dashboard-card mt-6"><div className="card-heading"><div><span className="kicker">Atendimento</span><h2>Fila de pedidos LGPD</h2></div><ClipboardList size={21} aria-hidden="true" /></div>{data?.requests.length ? <div className="compact-list mt-4">{data.requests.map((request) => { const events = data.requestEvents.filter((event) => event.requestId === request.id); return <div className="compact-list__row block md:flex" key={request.id}><div className="min-w-0"><strong>{labels[request.requestType]} <span className="text-muted-foreground font-normal">· referência pseudonimizada</span></strong><small>Recebido em {new Date(request.createdAt).toLocaleDateString("pt-BR")} · {request.scopeNote}</small>{request.decisionRationale ? <small>Decisão: {request.decisionRationale}</small> : null}{events.map((event) => <small key={event.id}>Evidência registrada: {event.evidenceReference || "referência interna"} · {event.note}</small>)}</div><div className="mt-3 md:mt-0 md:ml-4 md:w-80"><div className="flex gap-2 items-center"><select aria-label={`Estado do pedido ${request.id}`} value={requestStatusesById[request.id] ?? request.status} onChange={(event) => setRequestStatusesById((current) => ({ ...current, [request.id]: event.target.value as (typeof requestStatuses)[number] }))}>{requestStatuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select><span className={statusClass(request.status)}>{labels[request.status]}</span></div><textarea aria-label={`Justificativa da decisão ${request.id}`} value={decisionNotes[request.id] ?? ""} onChange={(event) => setDecisionNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Justificativa da decisão" /><button type="button" className="button button--outline mt-2" disabled={handleRequest.isPending || (decisionNotes[request.id] ?? "").trim().length < 12} onClick={() => void decideRequest(request.id)}>{handleRequest.isPending ? "Salvando…" : "Registrar decisão"}</button><input aria-label={`Referência de evidência ${request.id}`} value={evidenceReferences[request.id] ?? ""} onChange={(event) => setEvidenceReferences((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Referência de evidência (opcional)" /><textarea aria-label={`Nota de evidência ${request.id}`} value={eventNotes[request.id] ?? ""} onChange={(event) => setEventNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Nota de evidência ou marco de atendimento" /><button type="button" className="button button--outline mt-2" disabled={recordRequestEvent.isPending || (eventNotes[request.id] ?? "").trim().length < 12} onClick={() => void recordEvidence(request.id)}>{recordRequestEvent.isPending ? "Registrando…" : "Registrar evidência"}</button></div></div>; })}</div> : <div className="empty-state"><span><ShieldAlert size={21} /></span><div><strong>Nenhum pedido registrado</strong><p>Registre pedidos de titulares quando houver base operacional e contexto suficiente para revisão humana.</p></div></div>}</section>
  </div></DashboardLayout>;
}
