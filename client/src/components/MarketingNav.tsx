import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const logoUrl = "/manus-storage/regularizando-mark_ccce30b2.png";

export function BrandMark() {
  return <img src={logoUrl} alt="" className="brand__mark" onError={(event) => { event.currentTarget.style.opacity = "0"; }} />;
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
          <Link href="/casos-de-uso" onClick={() => setOpen(false)}>Casos de uso</Link>
          <Link href="/piloto-telecom" onClick={() => setOpen(false)}>Piloto telecom</Link>
          <Link href="/contato" onClick={() => setOpen(false)}>Contato</Link>
          <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
        </nav>
        <button className="button button--nav" type="button" onClick={() => setLocation("/dashboard")}>Começar agora <ArrowRight size={15} /></button>
      </div>
    </header>
  );
}
