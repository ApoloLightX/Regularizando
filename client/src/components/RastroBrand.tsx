type RastroSymbolProps = {
  className?: string;
  label?: string;
};

/**
 * Marca vetorial de "Rastro": três percursos convergem para um ponto de decisão.
 * Sem bitmap e sem tipografia embutida para manter legibilidade em favicon e navegação.
 */
export function RastroSymbol({ className, label }: RastroSymbolProps) {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      fill="none"
      focusable="false"
      role={label ? "img" : undefined}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 33c6.5-.9 10.7-4.3 13.1-10.3C23.4 16.9 28.3 13 38 12" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
      <path d="M9 14c5.2.4 9.2 2.4 12 6.2 3.9 5.3 8.5 8 17 8.8" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
      <path d="M11 25c4.3 0 7.4-1.2 10-4.1 4.3-4.7 8.1-6.7 17-6.7" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
      <circle cx="38" cy="12" fill="currentColor" r="4.5" />
    </svg>
  );
}
