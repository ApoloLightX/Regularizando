import MarketingNav from "@/components/MarketingNav";
import { CheckCircle2, ClipboardCheck, MapPinned, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { PRIVACY_REQUEST_TYPES, PRIVACY_REQUEST_TYPE_LABELS, type PrivacyRequestType } from "@shared/privacy";

const sectors = ["telecom", "infraestrutura", "industria", "consultoria", "outro"] as const;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactForm = {
  name: string;
  email: string;
  company: string;
  role: string;
  sector: (typeof sectors)[number];
  portfolioSize: string;
  challenge: string;
};

type FieldErrors = Partial<Record<"name" | "email" | "company" | "privacyScope" | "consent", string>>;

const blankForm: ContactForm = { name: "", email: "", company: "", role: "", sector: "telecom", portfolioSize: "", challenge: "" };

function submissionErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("too_many_requests") || normalized.includes("429") || normalized.includes("muitas tentativas")) return "Você fez muitas tentativas em pouco tempo. Aguarde alguns minutos antes de enviar novamente.";
  if (normalized.includes("email") || normalized.includes("e-mail")) return "O e-mail não pôde ser validado. Revise o formato, por exemplo: nome@empresa.com.";
  return "Não foi possível concluir o envio agora. Revise os campos destacados e tente novamente.";
}

export default function Contact() {
  const [form, setForm] = useState<ContactForm>(blankForm);
  const [requestCategory, setRequestCategory] = useState<"pilot" | "privacy">("pilot");
  const [privacyRequestType, setPrivacyRequestType] = useState<PrivacyRequestType>("acesso");
  const [privacyScope, setPrivacyScope] = useState("");
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const request = trpc.pilot.request.useMutation();
  const privacyRequest = trpc.pilot.privacyRequest.useMutation();
  const isSuccess = request.isSuccess || privacyRequest.isSuccess;
  const isPending = request.isPending || privacyRequest.isPending;
  const error = request.error || privacyRequest.error;

  const clearError = (key: keyof FieldErrors) => setFieldErrors((current) => ({ ...current, [key]: undefined }));
  const update = (key: keyof ContactForm, value: string) => {
    request.reset();
    privacyRequest.reset();
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "name" || key === "email" || key === "company") clearError(key);
  };

  const validate = () => {
    const errors: FieldErrors = {};
    if (form.name.trim().length < 2) errors.name = "Informe seu nome com pelo menos 2 caracteres.";
    if (!emailPattern.test(form.email.trim())) errors.email = "Informe um e-mail válido, como nome@empresa.com.";
    if (requestCategory === "pilot" && form.company.trim().length < 2) errors.company = "Informe o nome da empresa com pelo menos 2 caracteres.";
    if (requestCategory === "privacy" && privacyScope.trim().length < 12) errors.privacyScope = "Descreva o pedido com pelo menos 12 caracteres para que a equipe possa analisá-lo.";
    if (!consent) errors.consent = "É necessário confirmar a leitura do Aviso de Privacidade para enviar o formulário.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const reset = () => {
    request.reset();
    privacyRequest.reset();
    setForm(blankForm);
    setPrivacyScope("");
    setConsent(false);
    setFieldErrors({});
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    request.reset();
    privacyRequest.reset();
    if (!validate()) return;
    try {
      if (requestCategory === "privacy") {
        await privacyRequest.mutateAsync({ name: form.name.trim(), email: form.email.trim(), requestType: privacyRequestType, scopeNote: privacyScope.trim(), consent: true });
      } else {
        await request.mutateAsync({ ...form, name: form.name.trim(), email: form.email.trim(), company: form.company.trim(), role: form.role.trim() || undefined, portfolioSize: form.portfolioSize || undefined, challenge: form.challenge.trim() || undefined, consent: true });
      }
    } catch {
      // A falha é apresentada no bloco acessível abaixo; nenhum detalhe interno é exposto.
    }
  };

  const categoryChange = (next: "pilot" | "privacy") => {
    request.reset();
    privacyRequest.reset();
    setRequestCategory(next);
    setConsent(false);
    setFieldErrors({});
  };

  const fieldMessage = (key: keyof FieldErrors) => fieldErrors[key] ? <span className="field-error" id={`${key}-error`} role="alert">{fieldErrors[key]}</span> : null;
  const errorMessage = error ? submissionErrorMessage(error.message) : null;

  return <div className="marketing-page"><MarketingNav /><main><section className="contact-hero"><div><p className="eyebrow">Solicite um piloto</p><h1>Comece pelo risco que sua equipe precisa <em>enxergar agora.</em></h1><p>O piloto começa com um recorte concreto. Em vez de prometer uma transformação ampla, ele organiza uma amostra real de licenças, condicionantes, responsáveis e evidências para medir a prova de valor.</p><div className="contact-hero__checks"><span><MapPinned size={15} /> Ativos e território prioritários</span><span><ClipboardCheck size={15} /> Obrigações e fontes existentes</span><span><CheckCircle2 size={15} /> Decisões que precisam de responsável</span></div></div><section className="pilot-form-card" aria-labelledby="pilot-form-title">{isSuccess ? <div className="pilot-form-success" role="status" aria-live="polite"><CheckCircle2 size={30} /><h2 id="pilot-form-title">{requestCategory === "privacy" ? "Pedido de privacidade recebido." : "Solicitação recebida."}</h2><p>{requestCategory === "privacy" ? "Registramos o pedido para análise humana. Não ocorrerá exclusão ou alteração automática de dados." : "Registramos seus dados de contato. O próximo passo é alinhar o recorte, a equipe e as informações necessárias para avaliar um piloto."}</p><button className="button button--mint" type="button" onClick={reset}>Enviar outra solicitação</button></div> : <form onSubmit={submit} noValidate><p className="eyebrow">Fale com o Regularizando</p><h2 id="pilot-form-title">{requestCategory === "privacy" ? "Privacidade e dados pessoais" : "Desenhe seu piloto."}</h2><fieldset className="contact-request-kind"><legend>Motivo do contato</legend><label><input type="radio" name="requestCategory" checked={requestCategory === "pilot"} onChange={() => categoryChange("pilot")} /> Solicitar piloto</label><label><input type="radio" name="requestCategory" checked={requestCategory === "privacy"} onChange={() => categoryChange("privacy")} /> Privacidade e dados pessoais / LGPD</label></fieldset><p className="pilot-form-card__intro">{requestCategory === "privacy" ? "Use este canal para acesso, confirmação de tratamento, correção, exportação, exclusão, anonimização, oposição ou dúvidas. Não envie documentos, credenciais ou dados sensíveis desnecessários." : "Utilizaremos estas informações apenas para avaliar o piloto. Não envie documentos, licenças ou dados sensíveis neste formulário."}</p><div className="pilot-form-grid"><label>Nome completo<input required value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "name-error" : undefined} />{fieldMessage("name")}</label><label>E-mail de contato<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" inputMode="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} />{fieldMessage("email")}</label>{requestCategory === "pilot" ? <><label>Empresa<input required value={form.company} onChange={(event) => update("company", event.target.value)} autoComplete="organization" aria-invalid={Boolean(fieldErrors.company)} aria-describedby={fieldErrors.company ? "company-error" : undefined} />{fieldMessage("company")}</label><label>Função<input value={form.role} onChange={(event) => update("role", event.target.value)} autoComplete="organization-title" /></label><label>Setor<select value={form.sector} onChange={(event) => update("sector", event.target.value)}>{sectors.map((sector) => <option key={sector} value={sector}>{sector === "outro" ? "Outro" : sector[0].toUpperCase() + sector.slice(1)}</option>)}</select></label><label>Escala aproximada<select value={form.portfolioSize} onChange={(event) => update("portfolioSize", event.target.value)}><option value="">Selecione</option><option value="até 50 ativos">Até 50 ativos</option><option value="51 a 250 ativos">51 a 250 ativos</option><option value="251 a 1000 ativos">251 a 1.000 ativos</option><option value="mais de 1000 ativos">Mais de 1.000 ativos</option></select></label></> : <label>Tipo de solicitação<select value={privacyRequestType} onChange={(event) => setPrivacyRequestType(event.target.value as PrivacyRequestType)}>{PRIVACY_REQUEST_TYPES.map((item) => <option key={item} value={item}>{PRIVACY_REQUEST_TYPE_LABELS[item]}</option>)}</select></label>}</div>{requestCategory === "pilot" ? <label className="pilot-form-full">Qual rotina precisa de mais atenção? <textarea value={form.challenge} onChange={(event) => update("challenge", event.target.value)} maxLength={2000} placeholder="Ex.: vencimentos de licenças, condicionantes, evidências, CAPAs ou indicadores ESG." /></label> : <label className="pilot-form-full">Escopo ou contexto do pedido <textarea required value={privacyScope} onChange={(event) => { request.reset(); privacyRequest.reset(); setPrivacyScope(event.target.value); clearError("privacyScope"); }} minLength={12} maxLength={2000} placeholder="Descreva o pedido sem incluir documentos, credenciais ou dados sensíveis desnecessários." aria-invalid={Boolean(fieldErrors.privacyScope)} aria-describedby={fieldErrors.privacyScope ? "privacyScope-error" : undefined} />{fieldMessage("privacyScope")}</label>}<label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => { request.reset(); privacyRequest.reset(); setConsent(event.target.checked); clearError("consent"); }} aria-invalid={Boolean(fieldErrors.consent)} aria-describedby={fieldErrors.consent ? "consent-error" : undefined} /><span>Li o <Link href="/aviso-de-privacidade">Aviso de Privacidade</Link> e autorizo o tratamento destes dados exclusivamente para a finalidade descrita neste contato.</span></label>{fieldMessage("consent")}{errorMessage && <p className="form-error" role="alert"><strong>Não enviamos a solicitação.</strong> {errorMessage}</p>}<button className="button button--mint pilot-form-submit" type="submit" disabled={isPending} aria-busy={isPending}>{isPending ? "Enviando…" : <>{requestCategory === "privacy" ? "Enviar pedido" : "Solicitar piloto"} <Send size={15} /></>}</button></form>}</section></section></main></div>;
}
