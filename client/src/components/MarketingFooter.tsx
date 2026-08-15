import { Link } from "wouter";

export default function MarketingFooter() {
  return <footer className="marketing-footer"><div><strong>regularizando</strong><span>Inteligência para decisões ambientais verificáveis.</span></div><nav aria-label="Navegação do rodapé"><Link href="/produto">Produto</Link><Link href="/casos-de-uso">Casos de uso</Link><Link href="/seguranca">Segurança</Link><Link href="/aviso-de-privacidade">Aviso de Privacidade</Link><Link href="/contato">Solicitar piloto</Link></nav></footer>;
}
