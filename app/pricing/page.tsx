"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap, Building2, Rocket, ArrowRight, Shield, Clock, BarChart3, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const PLANS = [
  {
    name: "Solo",
    icon: Zap,
    desc: "Pour le SDR ou BDR qui veut une longueur d'avance.",
    monthlyPrice: 29,
    yearlyPrice: 23,
    highlight: false,
    badge: null,
    features: [
      "1 utilisateur",
      "500 leads scorés / mois",
      "Brief complet par lead (score, ouverture, objections, timing, piège)",
      "Export Excel mis en forme",
      "Historique 30 jours",
      "Support email",
    ],
    cta: "Commencer",
    ctaHref: "/login",
  },
  {
    name: "Pro",
    icon: Rocket,
    desc: "Pour les équipes commerciales qui scèlent des deals chaque semaine.",
    monthlyPrice: 79,
    yearlyPrice: 63,
    highlight: true,
    badge: "Le plus populaire",
    features: [
      "5 utilisateurs",
      "3 000 leads scorés / mois",
      "Tout Solo, plus :",
      "Config ICP sauvegardée",
      "Historique illimité",
      "Retry automatique sur erreur",
      "Support prioritaire (réponse < 4h)",
      "Onboarding personnalisé",
    ],
    cta: "Essayer 14 jours gratuit",
    ctaHref: "/login",
  },
  {
    name: "Scale",
    icon: Building2,
    desc: "Pour les équipes qui industrialisent leur prospection B2B.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    highlight: false,
    badge: null,
    features: [
      "Utilisateurs illimités",
      "Leads illimités",
      "Tout Pro, plus :",
      "Accès API (webhooks & intégrations)",
      "SSO / SAML",
      "Contrat de service (SLA 99,9 %)",
      "Account manager dédié",
      "Facturation annuelle sur devis",
    ],
    cta: "Nous contacter",
    ctaHref: "mailto:sales@revora.app",
  },
];

const GUARANTEES = [
  { icon: Shield, title: "Données sécurisées", desc: "Chiffrement TLS, Firestore rules par utilisateur, zéro partage tiers à des fins marketing." },
  { icon: Clock, title: "14 jours satisfait ou remboursé", desc: "Tu testes, tu valides, tu restes. Sinon on te rembourse sans question." },
  { icon: BarChart3, title: "ROI mesurable", desc: "9 RDV générés sur la première mission pilote. Nos clients mesurent leur ROI dès le 1er mois." },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="bg-grid absolute inset-0" />
      <div className="glow glow-violet drift -left-60 top-0 h-[500px] w-[500px]" />
      <div className="glow glow-teal absolute -bottom-20 right-0 h-[400px] w-[400px]" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-16">

        {/* Header */}
        <div className="reveal mx-auto max-w-[600px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted">
            Tarifs
          </span>
          <h1 className="font-display mt-5 text-4xl font-extrabold leading-tight tracking-tight">
            <span className="text-gradient">Prix clairs.</span>{" "}
            <span className="text-ink">Valeur immédiate.</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Pas de frais cachés, pas d'engagement surprise. Tu paies pour des leads mieux qualifiés et des briefs qui convertissent.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent2/40 bg-accent2/10 px-4 py-1.5 text-sm font-medium text-accent2">
            <Sparkles size={15} />
            Offre de lancement — tarifs réduits pour les premiers inscrits
          </div>

          {/* Toggle annuel/mensuel */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-surface/60 p-1">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!yearly ? "bg-elevated text-ink" : "text-muted hover:text-ink"}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${yearly ? "bg-elevated text-ink" : "text-muted hover:text-ink"}`}
            >
              Annuel
              <span className="ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 font-mono text-[10px] text-accent">-20 %</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="reveal reveal-1 mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            // Prix normal = prix de lancement + 10€/mois (ramené au tarif annuel −20%).
            const normalMonthly = plan.monthlyPrice + 10;
            const strike = yearly ? Math.round(normalMonthly * 0.8) : normalMonthly;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-7 transition-all ${
                  plan.highlight
                    ? "border-accent/40 bg-accent/5 shadow-lg shadow-accent/10"
                    : "border-border bg-surface/40"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${plan.highlight ? "border-accent/40 bg-accent/10" : "border-border bg-elevated"}`}>
                    <Icon size={17} className={plan.highlight ? "text-accent" : "text-muted"} />
                  </span>
                  <div>
                    <p className="font-display font-bold text-ink">{plan.name}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted">{plan.desc}</p>

                <div className="mt-6">
                  <div className="flex items-end gap-2">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-ink">{price}€</span>
                    <span className="mb-1 text-base text-muted line-through decoration-skip/70">{strike}€</span>
                    <span className="mb-1 text-sm text-muted">/mois</span>
                  </div>
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent2/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-accent2">
                    Prix de lancement
                  </p>
                  {yearly && (
                    <p className="mt-2 font-mono text-xs text-muted">
                      Facturé {price * 12}€ / an — économise {(plan.monthlyPrice - price) * 12}€
                    </p>
                  )}
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`mt-6 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "btn-premium text-white"
                      : "border border-border bg-elevated text-ink hover:border-accent/40"
                  }`}
                >
                  {plan.cta} <ArrowRight size={14} />
                </Link>

                <div className="mt-7 flex flex-col gap-2.5 border-t border-border pt-6">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <Check size={14} className={`mt-0.5 shrink-0 ${plan.highlight ? "text-accent" : "text-accent2"}`} />
                      <span className="text-sm text-muted">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Garanties */}
        <div className="reveal reveal-2 mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {GUARANTEES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 rounded-xl border border-border bg-surface/30 p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated">
                <Icon size={18} className="text-accent" />
              </span>
              <div>
                <p className="font-medium text-ink">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ rapide */}
        <div className="reveal reveal-3 mx-auto mt-20 max-w-[700px]">
          <h2 className="font-display text-center text-2xl font-extrabold tracking-tight text-ink">Questions fréquentes</h2>
          <div className="mt-8 flex flex-col gap-4">
            {[
              { q: "Y a-t-il un engagement ?", r: "Non. Les abonnements mensuels sont sans engagement, résiliables à tout moment depuis ton espace. L'abonnement annuel est prépayé et non remboursable après 14 jours." },
              { q: "Que se passe-t-il si je dépasse mon quota ?", r: "Tu reçois une notification à 80 % du quota. Au-delà, l'analyse est suspendue jusqu'au renouvellement ou à l'upgrade. Pas de surcharge automatique." },
              { q: "Puis-je changer de plan ?", r: "Oui, à tout moment. L'upgrade est immédiat. Le downgrade prend effet à la prochaine période de facturation." },
              { q: "Les données de mes clients sont-elles protégées ?", r: "Chaque utilisateur accède uniquement à ses propres données. Les fichiers CSV sont traités via l'API Gemini pour le scoring puis stockés chiffrés. Voir notre politique de confidentialité." },
            ].map(({ q, r }) => (
              <div key={q} className="rounded-xl border border-border bg-surface/30 px-6 py-5">
                <p className="font-medium text-ink">{q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            D'autres questions ?{" "}
            <Link href="/faq" className="font-medium text-accent hover:opacity-80">
              Voir la FAQ complète →
            </Link>{" "}
            ou{" "}
            <a href="mailto:sales@revora.app" className="font-medium text-accent hover:opacity-80">
              nous écrire
            </a>
          </p>
        </div>

        {/* CTA final */}
        <div className="reveal reveal-3 mx-auto mt-20 max-w-[600px] rounded-2xl border border-border bg-surface/40 p-10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Prêt à scorer tes leads ?</p>
          <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-ink">
            Commence à prospecter comme un senior dès aujourd'hui.
          </h2>
          <p className="mt-3 text-sm text-muted">14 jours gratuits sur le plan Pro. Sans carte bancaire.</p>
          <Link
            href="/login"
            className="btn-premium mt-7 inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white"
          >
            Créer mon compte <ArrowRight size={15} />
          </Link>
        </div>

      </div>

      {/* Footer liens légaux */}
      <div className="border-t border-border py-8">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5">
          <Logo size={20} wordmarkClassName="text-sm" />
          <div className="flex gap-6 text-xs text-muted">
            <Link href="/legal" className="hover:text-ink transition-colors">CGU</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Confidentialité</Link>
            <Link href="/faq" className="hover:text-ink transition-colors">FAQ</Link>
            <a href="mailto:sales@revora.app" className="hover:text-ink transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}
