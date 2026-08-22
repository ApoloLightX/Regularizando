import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Download, FileText, FileUp, LockKeyhole, ShieldCheck, UploadCloud, X, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const entityOptions = [
  { value: "licenca", label: "Licença" }, { value: "condicionante", label: "Condicionante" }, { value: "capa", label: "CAPA" }, { value: "incidente", label: "Ocorrência" }, { value: "esg", label: "Indicador ESG" }, { value: "site", label: "Site" }, { value: "outro", label: "Outro" },
] as const;

type AuthorizationKind = "processing" | "download";

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.readAsDataURL(file);
  });
}

function normalizedMimeType(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") return "text/csv";
  if (extension === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return file.type;
}

function quarantineLabel(value: string) {
  const labels: Record<string, string> = {
    uploaded: "enviada",
    quarantined_unscanned: "quarentena sem antimalware",
    validated: "estrutura validada",
    approved_for_processing: "processamento autorizado",
    blocked: "bloqueada",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export default function Evidences() {
  const overview = trpc.dashboard.overview.useQuery();
  const utils = trpc.useUtils();
  const upload = trpc.evidences.upload.useMutation({ onSuccess: () => void utils.dashboard.overview.invalidate() });
  const authorize = trpc.evidences.authorize.useMutation({ onSuccess: () => void utils.dashboard.overview.invalidate() });
  const download = trpc.evidences.download.useMutation();
  const decideReview = trpc.reviews.decide.useMutation({ onSuccess: () => void utils.dashboard.overview.invalidate() });
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<(typeof entityOptions)[number]["value"]>("outro");
  const [entityId, setEntityId] = useState("");
  const [authorization, setAuthorization] = useState<{ evidenceId: number; kind: AuthorizationKind } | null>(null);
  const [authorizationNote, setAuthorizationNote] = useState("");

  async function uploadEvidence() {
    if (!file) return;
    const base64 = await readFile(file);
    await upload.mutateAsync({ entityType, entityId: entityId ? Number(entityId) : undefined, fileName: file.name, mimeType: normalizedMimeType(file), sizeBytes: file.size, base64 });
    setFile(null); setEntityId("");
  }

  async function downloadEvidence(evidenceId: number) {
    const result = await download.mutateAsync({ evidenceId });
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  function openAuthorization(evidenceId: number, kind: AuthorizationKind) {
    setAuthorization({ evidenceId, kind });
    setAuthorizationNote("");
    authorize.reset();
  }

  async function submitAuthorization() {
    if (!authorization || authorizationNote.trim().length < 12) return;
    await authorize.mutateAsync({ evidenceId: authorization.evidenceId, authorization: authorization.kind, note: authorizationNote.trim() });
    setAuthorization(null);
    setAuthorizationNote("");
  }

  const data = overview.data?.data;
  const membership = overview.data?.membership;
  const canAuthorize = Boolean(membership && ["owner", "admin", "reviewer"].includes(membership.role));

  return <DashboardLayout><div className="evidence-page"><header className="dashboard-page__header"><div><p className="kicker">Cadeia de custódia documental</p><h1>Evidências</h1><p className="dashboard-subtitle">O arquivo vai para storage controlado; o painel preserva metadados, integridade, quarentena, revisão e autorizações humanas separadas.</p></div><Link href="/dashboard" className="button button--outline">Voltar ao painel</Link></header>{!overview.data?.organization ? <div className="dashboard-card"><p>Crie uma organização antes de enviar evidências.</p><Link href="/dashboard" className="button button--dark">Criar espaço de trabalho</Link></div> : <div className="evidence-layout"><section className="upload-card"><div className="upload-card__icon"><UploadCloud size={24} /></div><h2>Enviar uma evidência</h2><p>PDF, JPG, PNG, DOCX, XLSX ou CSV de até 8 MB. O servidor valida tamanho, assinatura e estrutura compatível antes de armazenar o arquivo em quarentena.</p><label className="file-picker">{file ? file.name : "Selecionar arquivo"}<input type="file" accept="application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,.csv,.xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><div className="form-row"><label>Vincular a<select value={entityType} onChange={(event) => setEntityType(event.target.value as (typeof entityOptions)[number]["value"])}>{entityOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><label>ID do registro <small>Opcional</small><input type="number" min="1" value={entityId} onChange={(event) => setEntityId(event.target.value)} /></label></div>{upload.error && <p className="form-error" role="alert">{upload.error.message}</p>}<button className="button button--dark" type="button" disabled={!file || upload.isPending} onClick={() => void uploadEvidence()}>{upload.isPending ? "Enviando…" : "Enviar para quarentena e revisão"} <FileUp size={16} /></button><p className="empty-copy"><strong>Importante:</strong> validação estrutural não significa arquivo livre de malware. A liberação continua dependente de revisão e autorização humana.</p></section><section className="dashboard-card evidence-register"><div className="card-heading"><div><span className="kicker">Registro de evidências</span><h2>Arquivos, revisão e liberação</h2></div><span className="status-chip status-chip--verified"><ShieldCheck size={13} /> {data?.evidences.length ?? 0} itens</span></div>{download.error && <p className="form-error" role="alert">{download.error.message}</p>}{(data?.evidences.length ?? 0) === 0 ? <div className="empty-state"><span><FileText size={21} /></span><div><strong>Nenhum arquivo enviado</strong><p>Assim que uma evidência for anexada, ela aparecerá aqui com os estados de quarentena, revisão e autorização.</p></div></div> : <div className="compact-list">{data?.evidences.map((evidence) => {
    const review = data.reviewRequests.find((item) => item.evidenceId === evidence.id);
    const processingAuthorized = Boolean(evidence.processingAuthorizedAt);
    const downloadAuthorized = Boolean(evidence.downloadAuthorizedAt);
    const canDownload = evidence.quarantineStatus === "approved_for_processing" && downloadAuthorized;
    const reviewApproved = evidence.reviewStatus === "verificada";
    return <div className="compact-list__row evidence-review-row" key={evidence.id}><div className="evidence-link"><span className="evidence-file"><FileText size={16} /></span><div><strong>{evidence.fileName}</strong><small>{evidence.mimeType} · {(evidence.sizeBytes / 1024).toFixed(0)} KB · {new Date(evidence.createdAt).toLocaleDateString("pt-BR")}</small><small>Quarentena: {quarantineLabel(evidence.quarantineStatus)} · SHA-256 {evidence.sha256 ? "registrado" : "ausente"}</small></div></div><div className="evidence-decision">{review?.status === "pendente" ? <><span className="status-chip status-chip--pendente">Aguardando revisão</span>{canAuthorize ? <div><button aria-label="Aprovar evidência" className="decision-button decision-button--approve" type="button" disabled={decideReview.isPending} onClick={() => void decideReview.mutateAsync({ reviewId: review.id, status: "aprovada" })}><CheckCircle2 size={14} /></button><button aria-label="Rejeitar evidência" className="decision-button decision-button--reject" type="button" disabled={decideReview.isPending} onClick={() => void decideReview.mutateAsync({ reviewId: review.id, status: "rejeitada" })}><XCircle size={14} /></button></div> : null}</> : <span className={`status-chip ${reviewApproved ? "status-chip--verified" : "status-chip--vencida"}`}><CheckCircle2 size={12} /> {evidence.reviewStatus}</span>}{reviewApproved && canAuthorize && !processingAuthorized && evidence.quarantineStatus !== "blocked" ? <button className="button button--outline button--small" type="button" onClick={() => openAuthorization(evidence.id, "processing")}><LockKeyhole size={14} /> Autorizar processamento</button> : null}{reviewApproved && canAuthorize && processingAuthorized && !downloadAuthorized ? <button className="button button--outline button--small" type="button" onClick={() => openAuthorization(evidence.id, "download")}><LockKeyhole size={14} /> Autorizar download</button> : null}<button className="button button--dark button--small" type="button" disabled={!canDownload || download.isPending} aria-disabled={!canDownload || download.isPending} title={canDownload ? "Abrir URL temporária autorizada" : "O download exige revisão, autorização de processamento e autorização separada de download."} onClick={() => void downloadEvidence(evidence.id)}><Download size={14} /> {download.isPending ? "Abrindo…" : "Baixar"}</button></div></div>;
  })}</div>}</section></div>}{authorization ? <div className="entry-backdrop" role="presentation" onClick={() => setAuthorization(null)}><section className="entry-panel" role="dialog" aria-modal="true" aria-labelledby="evidence-authorization-title" onClick={(event) => event.stopPropagation()}><button className="entry-close" type="button" aria-label="Fechar" onClick={() => setAuthorization(null)}><X size={17} /></button><div className="entry-form"><span className="kicker">Ato humano auditável</span><h2 id="evidence-authorization-title">{authorization.kind === "processing" ? "Autorizar processamento" : "Autorizar download"}</h2><p className="dialog-copy">{authorization.kind === "processing" ? "Esta autorização permite que a evidência saia da quarentena operacional para uso no fluxo. Ela não declara o arquivo como livre de malware." : "O download é uma autorização distinta do processamento e ficará registrado com responsável, data e justificativa."}</p><label>Justificativa<textarea autoFocus minLength={12} value={authorizationNote} onChange={(event) => setAuthorizationNote(event.target.value)} placeholder="Registre o motivo, contexto e limite desta autorização." /></label>{authorize.error && <p className="form-error" role="alert">{authorize.error.message}</p>}<button className="button button--dark" type="button" disabled={authorize.isPending || authorizationNote.trim().length < 12} onClick={() => void submitAuthorization()}>{authorize.isPending ? "Registrando…" : "Confirmar autorização"}</button></div></section></div> : null}</div></DashboardLayout>;
}
