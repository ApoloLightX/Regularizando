import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";

const roleLabel: Record<string, string> = { admin: "Administrador", analyst: "Analista", reviewer: "Revisor", viewer: "Leitor" };

export default function InviteAccept() {
  const [, params] = useRoute("/convites/:token");
  const token = params?.token ?? "";
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const preview = trpc.invitations.preview.useQuery({ token }, { enabled: Boolean(token) });
  const accept = trpc.invitations.accept.useMutation({ onSuccess: () => setLocation("/dashboard") });

  useEffect(() => {
    if (isAuthenticated) sessionStorage.removeItem("regularizando-pending-invite");
  }, [isAuthenticated]);

  function logInForInvitation() {
    sessionStorage.setItem("regularizando-pending-invite", token);
    startLogin();
  }

  if (loading || preview.isLoading) return <div className="invite-accept-page"><div className="invite-accept-card">Validando convite…</div></div>;
  if (!preview.data?.available) return <div className="invite-accept-page"><div className="invite-accept-card"><UsersRound size={28} /><p className="eyebrow">Convite indisponível</p><h1>Este convite expirou, foi revogado ou já foi utilizado.</h1><p>Peça ao administrador da organização que gere um novo link.</p><Link href="/" className="button button--dark">Voltar ao início</Link></div></div>;
  return <div className="invite-accept-page"><div className="invite-accept-card"><span className="status-chip status-chip--verified"><ShieldCheck size={13} /> Convite vinculado a e-mail</span><p className="eyebrow">Você foi convidado para</p><h1>{preview.data.organizationName}</h1><p>Ao aceitar, você entrará na organização como <strong>{roleLabel[preview.data.role ?? ""]}</strong>. Seu acesso e suas decisões ficarão registrados na trilha de auditoria.</p>{accept.error && <p className="form-error">{accept.error.message}</p>}{isAuthenticated ? <button type="button" className="button button--mint" disabled={accept.isPending} onClick={() => void accept.mutateAsync({ token })}>{accept.isPending ? "Aceitando…" : "Aceitar convite"} <CheckCircle2 size={16} /></button> : <button type="button" className="button button--dark" onClick={logInForInvitation}>Entrar para aceitar</button>}</div></div>;
}
