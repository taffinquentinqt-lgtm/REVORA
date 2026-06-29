/**
 * URL canonique du site, utilisée pour les métadonnées sociales (OpenGraph),
 * le sitemap et le robots.txt. Surchargeable via NEXT_PUBLIC_SITE_URL côté
 * Vercel le jour où un domaine propre (ex. revora.app) sera branché.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://revora-sales.vercel.app"
).replace(/\/$/, "");
