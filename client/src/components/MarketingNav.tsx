import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { RastroSymbol } from "./RastroBrand";

export function BrandMark() {
  return <RastroSymbol className="brand__mark" />;
}

export default function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  return (
    <header className="marketing-header">
      <div className="marketing-header__inner">
        <Link href="/" className="brand" aria-label="Regularizando, voltar ao início"><BrandMark /><span className="brand__name">regularizando</span></Link>
        <button className="menu-toggle marketing-menu" type="button" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen((value) => !value)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        <nav className={`marketing-nav ${open ? "marketing-nav--open" : ""}`} aria-label="Navegação principal">
          <Link href="/produto" onClick={() => setOpen(false)}>Produto</Link>
          <Link href="/demonstracao" onClick={() => setOpen(false)}>Demonstração</Link>
          <Link href="/casos-de-uso" onClick={() => setOpen(false)}>Casos de uso</Link>
          <Link href="/seguranca" onClick={() => setOpen(false)}>Segurança</Link>
          <Link href="/piloto-telecom" onClick={() => setOpen(false)}>Piloto telecom</Link>
          <Link href="/implantacao-e-sucesso" onClick={() => setOpen(false)}>Implantação</Link>
          <Link href="/contato" onClick={() => setOpen(false)}>Contato</Link>
          <Link href="/dashboard" onClick={() => setOpen(false)}>Entrar</Link>
        </nav>
        <button className="button button--nav" type="button" onClick={() => setLocation("/contato")}>Solicitar piloto <ArrowRight size={15} /></button>
      </div>
    </header>
  );
}
