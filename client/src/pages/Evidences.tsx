import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, FileText, FileUp, ShieldCheck, UploadCloud, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const entityOptions = [
  { value: "licenca", label: "Licença" }, { value: "condicionante", label: "Condicionante" }, { value: "capa", label: "CAPA" }, { value: "incidente", label: "Ocorrência" }, { value: "esg", label: "Indicador ESG" }, { value: "site", label: "Site" }, { value: "outro", label: "Outro" },
] as const;

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.readAsDataURL(file);
  });
}

export default function Evidences() {
  const overview = trpc.dashboard.overview.useQuery();
  const utils = trpc.useUtils();
  const upload = trpc.evidences.upload.useMutation({ onSuccess: () => void utils.dashboard.overview.invalidate() });
  const decideReview = trpc.reviews.decide.useMutation({ onSuccess: () => void utils.dashboard.overview.invalidate() });
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<(typeof entityOptions)[number]["value"]>("outro");
  const [entityId, setEntityId] = useState("");

  async function uploadEvidence() {
    if (!file) return;
    const base64 = await readFile(file);
    await upload.mutateAsync({ entityType, entityId: entityId ? Number(entityId) : undefined, fileName: file.name, mimeType: file.type, sizeBytes: file.size, base64 });
    setFile(null); setEntityId("");
  }

  const data = overview.data?.data;
  return <DashboardLayout><div className="evidence-page"><header className="dashboard-page__header"><div><p className="kicker">Cadeia de custódia documental</p><h1>Evidências</h1><p className="dashboard-subtitle">O arquivo vai para storage seguro; o painel retém apenas metadados, vínculo, responsável e status de revisão.</p></div><Link href="/dashboard" className="button button--outline">Voltar ao painel</Link></header>{!overview.data?.organization ? <div className="dashboard-card"><p>Crie uma organização antes de enviar evidências.</p><Link href="/dashboard" className="button button--dark">Criar espaço de trabalho</Link></div> : <div className="evidence-layout"><section className="upload-card"><div className="upload-card__icon"><UploadCloud size={24} /></div><h2>Enviar uma evidência</h2><p>PDF, JPG, PNG ou DOCX de até 8 MB. O upload é validado no servidor antes de ser armazenado e entra em uma fila de revisão humana.</p><label className="file-picker">{file ? file.name : "Selecionar arquivo"}<input type="file" accept="application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><div className="form-row"><label>Vincular a<select value={entityType} onChange={(event) => setEntityType(event.target.value as (typeof entityOptions)[number]["value"])}>{entityOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><label>ID do registro <small>Opcional</small><input type="number" min="1" value={entityId} onChange={(event) => setEntityId(event.target.value)} /></label></div>{upload.error && <p className="form-error">{upload.error.message}</p>}<button className="button button--dark" type="button" disabled={!file || upload.isPending} onClick={() => void uploadEvidence()}>{upload.isPending ? "Enviando…" : "Enviar e enviar para revisão"} <FileUp size={16} /></button></section><section className="dashboard-card evidence-register"><div className="card-heading"><div><span className="kicker">Registro de evidências</span><h2>Arquivos e decisões</h2></div><span className="status-chip status-chip--verified"><ShieldCheck size={13} /> {data?.evidences.length ?? 0} itens</span></div>{(data?.evidences.length ?? 0) === 0 ? <div className="empty-state"><span><FileText size={21} /></span><div><strong>Nenhum arquivo enviado</strong><p>Assim que uma evidência for anexada, ela aparecerá aqui com seu status e fila de revisão.</p></div></div> : <div className="compact-list">{data?.evidences.map((evidence) => { const review = data.reviewRequests.find((item) => item.evidenceId === evidence.id); return <div className="compact-list__row evidence-review-row" key={evidence.id}><a href={evidence.fileUrl} target="_blank" rel="noreferrer" className="evidence-link"><span className="evidence-file"><FileText size={16} /></span><div><strong>{evidence.fileName}</strong><small>{evidence.mimeType} · {(evidence.sizeBytes / 1024).toFixed(0)} KB · {new Date(evidence.createdAt).toLocaleDateString("pt-BR")}</small></div></a><div className="evidence-decision">{review?.status === "pendente" ? <><span className="status-chip status-chip--pendente">Aguardando revisão</span><div><button aria-label="Aprovar evidência" className="decision-button decision-button--approve" type="button" disabled={decideReview.isPending} onClick={() => void decideReview.mutateAsync({ reviewId: review.id, status: "aprovada" })}><CheckCircle2 size={14} /></button><button aria-label="Rejeitar evidência" className="decision-button decision-button--reject" type="button" disabled={decideReview.isPending} onClick={() => void decideReview.mutateAsync({ reviewId: review.id, status: "rejeitada" })}><XCircle size={14} /></button></div></> : <span className={`status-chip ${evidence.reviewStatus === "verificada" ? "status-chip--verified" : "status-chip--vencida"}`}><CheckCircle2 size={12} /> {evidence.reviewStatus}</span>}</div></div>; })}</div>}</section></div>}</div></DashboardLayout>;
}
