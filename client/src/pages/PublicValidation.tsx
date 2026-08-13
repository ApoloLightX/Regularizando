import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BookMarked, CircleAlert, FileSearch, ShieldCheck } from "lucide-react";
import { useState } from "react";

const reviewLabels = {
  pendente_revisao_humana: "Pendente de revisão humana",
  aprovada: "Aprovada",
  corrigida: "Corrigida",
  rejeitada: "Rejeitada",
  solicitada_revisao: "Solicitada revisão",
} as const;

export default function PublicValidation() {
  const overview = trpc.publicValidation.overview.useQuery();
  const utils = trpc.useUtils();
  const review = trpc.publicValidation.reviewFinding.useMutation({ onSuccess: () => void utils.publicValidation.overview.invalidate() });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [statuses, setStatuses] = useState<Record<number, "aprovada" | "corrigida" | "rejeitada" | "solicitada_revisao">>({});

  if (overview.isLoading) return <DashboardLayout><div className="dashboard-loading">Carregando casos públicos de validação técnica…</div></DashboardLayout>;
  if (overview.error) return <DashboardLayout><section className="dashboard-card team-empty"><ShieldCheck size={28} /><h1>Área restrita à administração do produto.</h1><p>Casos públicos de validação técnica são separados de organizações, clientes e pilotos privados.</p></section></DashboardLayout>;

  const sourcesByCase = (overview.data?.cases ?? []).map(item => ({ ...item, sources: (overview.data?.sources ?? []).filter(source => source.caseId === item.id) }));
  const findingsBySource = (sourceId: number) => (overview.data?.findings ?? []).filter(finding => finding.sourceId === sourceId);
  const requirementByFinding = (findingId: number) => (overview.data?.requirements ?? []).find(requirement => requirement.findingId === findingId);

  return <DashboardLayout><div className="team-page">
    <header className="dashboard-page__header"><div><p className="kicker">QA interno · fontes oficiais · nenhuma organização privada</p><h1>Validação técnica pública</h1><p className="dashboard-subtitle">Demonstração rastreável do fluxo documento → condicionante → achado estruturado → revisão humana. Estes dados não são clientes, não são piloto contratado e não comprovam atendimento.</p></div><span className="status-chip status-chip--verified"><BookMarked size={13} /> {overview.data?.sources.length ?? 0} fontes oficiais</span></header>
    <section className="dashboard-card pending-invites"><div className="card-heading"><div><span className="kicker">Limite de uso</span><h2>Casos públicos de validação técnica</h2></div><span className="row-status">sem vínculo organizacional</span></div><div className="empty-state"><span><CircleAlert size={21} /></span><div><strong>Revisão humana continua obrigatória.</strong><p>Um prazo ou uma evidência só é exibido quando consta expressamente no documento. O que não está na fonte fica como não identificado ou pendente de revisão técnica.</p></div></div></section>
    {sourcesByCase.map(validationCase => <section className="dashboard-card pending-invites" key={validationCase.id}><div className="card-heading"><div><span className="kicker">{validationCase.classification.replaceAll("_", " ")}</span><h2>{validationCase.title}</h2><p className="dashboard-subtitle">{validationCase.purpose}</p></div><span className="row-status">{validationCase.status}</span></div>{validationCase.sources.map(source => <div className="source-card" key={source.id}><div className="card-heading"><div><h3>{source.identifier}</h3><p className="dashboard-subtitle">{source.title}</p><small>{source.issuer} · jurisdição {source.jurisdiction} · {source.extractionMethod === "ocr" ? "OCR: conferir visualmente" : "texto nativo verificado"}</small></div><a className="text-link" href={source.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte oficial</a></div><div className="assignment-list">{findingsBySource(source.id).map(finding => { const requirement = requirementByFinding(finding.id); return <article className="assignment-row" key={finding.id}><div className="public-validation-finding"><span className="role-badge role-badge--viewer">Condicionante {finding.conditionCode} · {finding.sourceLocator}</span><strong>{finding.structuredObligation}</strong><small><b>Trecho original:</b> {finding.sourceExcerpt}</small><small><b>Requisito:</b> {requirement ? `${requirement.code} · ${requirement.title}` : "não estruturado"}</small><small><b>Prazo:</b> {finding.dueText ?? "não identificado na fonte"} · <b>Frequência:</b> {finding.recurrenceLabel ?? "não identificada na fonte"}</small><small><b>Evidência esperada:</b> {requirement?.expectedEvidenceDescription ?? finding.expectedEvidenceDescription ?? "não identificada na fonte"}</small><small><b>Aplicabilidade:</b> {requirement?.applicabilityStatus?.replaceAll("_", " ") ?? "pendente de revisão técnica"} · <b>Revisão:</b> {reviewLabels[finding.reviewStatus]}</small></div><div className="public-validation-review"><select aria-label={`Decisão de revisão para condicionante ${finding.conditionCode}`} value={statuses[finding.id] ?? ""} onChange={event => setStatuses(current => ({ ...current, [finding.id]: event.target.value as "aprovada" | "corrigida" | "rejeitada" | "solicitada_revisao" }))}><option value="">Selecionar decisão</option><option value="aprovada">Aprovar</option><option value="corrigida">Corrigir</option><option value="rejeitada">Rejeitar</option><option value="solicitada_revisao">Solicitar revisão</option></select><Textarea aria-label={`Justificativa de revisão da condicionante ${finding.conditionCode}`} placeholder="Justificativa técnica obrigatória" value={notes[finding.id] ?? ""} onChange={event => setNotes(current => ({ ...current, [finding.id]: event.target.value }))} /><Button size="sm" disabled={!statuses[finding.id] || (notes[finding.id] ?? "").trim().length < 8 || review.isPending} onClick={() => void review.mutateAsync({ findingId: finding.id, reviewStatus: statuses[finding.id]!, reviewRationale: notes[finding.id].trim() })}>Registrar decisão</Button></div></article>})}</div></div>)}</section>)}
    <section className="dashboard-card pending-invites"><div className="card-heading"><div><span className="kicker">Fluxo comprovado</span><h2>Fonte → condicionante → achado → revisão</h2></div><FileSearch size={20} /></div><p className="dashboard-subtitle">Não há ativo, coordenada, responsável, evidência de cumprimento ou obrigação de cliente criada por estes casos. A passagem para o Motor de Obrigações de uma organização exige importação própria, confirmação de escopo e revisão humana.</p></section>
  </div></DashboardLayout>;
}
