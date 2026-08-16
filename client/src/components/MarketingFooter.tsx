import { Link } from "wouter";
import { RastroSymbol } from "./RastroBrand";

export default function MarketingFooter() {
  return <footer className="marketing-footer"><div><span className="marketing-footer__brand"><RastroSymbol className="marketing-footer__mark" /><strong>regularizando</strong></span><span>Gestão ambiental verificável, da fonte à decisão.</span></div><nav aria-label="Navegação do rodapé"><Link href="/produto">Produto</Link><Link href="/casos-de-uso">Casos de uso</Link><Link href="/seguranca">Segurança</Link><Link href="/aviso-de-privacidade">Aviso de Privacidade</Link><Link href="/contato">Solicitar piloto</Link></nav></footer>;
}
