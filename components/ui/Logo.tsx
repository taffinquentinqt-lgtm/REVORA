/**
 * Logo REVORA — le mark "cible" symbolise la précision du ciblage de leads.
 * Couleurs câblées sur les variables de thème (accent / accent2) : le logo
 * suit automatiquement la palette du site. Une seule source de vérité — à
 * réutiliser partout (nav, footers, écrans) plutôt que de recopier du SVG.
 */

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 28, className = "" }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="REVORA"
    >
      <rect width="64" height="64" rx="16" fill="var(--color-accent)" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="#ffffff" strokeWidth="5" />
      <circle cx="32" cy="32" r="9" fill="none" stroke="#ffffff" strokeWidth="5" />
      <circle cx="32" cy="32" r="3.6" fill="var(--color-accent2)" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  v2?: boolean;
  wordmarkClassName?: string;
  className?: string;
}

export function Logo({
  size = 28,
  withWordmark = true,
  v2 = false,
  wordmarkClassName = "text-lg",
  className = "",
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span
          className={`font-display font-extrabold tracking-tight text-ink ${wordmarkClassName}`}
        >
          REVORA
        </span>
      )}
      {v2 && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          v2
        </span>
      )}
    </span>
  );
}
