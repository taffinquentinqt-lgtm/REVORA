/**
 * Lien de paiement Stripe (Payment Link).
 *
 * ⚠️ Actuellement en MODE TEST (buy.stripe.com/test_...).
 * Pour passer en production :
 *   • soit remplace l'URL ci-dessous par ton lien live,
 *   • soit définis NEXT_PUBLIC_STRIPE_PAYMENT_LINK dans Vercel (recommandé,
 *     aucun changement de code).
 */
export const STRIPE_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ??
  "https://buy.stripe.com/test_5kQ8wHcDqbPZ2El57jcfK00";

/** Ajoute l'email du compte au lien (préremplit le checkout → réconciliation facile). */
export function paymentLinkFor(email: string | null): string {
  if (!email) return STRIPE_PAYMENT_LINK;
  const sep = STRIPE_PAYMENT_LINK.includes("?") ? "&" : "?";
  return `${STRIPE_PAYMENT_LINK}${sep}prefilled_email=${encodeURIComponent(email)}`;
}
