"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    title: "Le service",
    items: [
      {
        q: "C'est quoi REVORA exactement ?",
        r: "REVORA est une plateforme de sales intelligence B2B. Tu uploades un fichier CSV de leads, tu configures ton ICP (Ideal Customer Profile), et REVORA génère pour chaque lead un brief opérationnel complet : score de priorité, première phrase d'approche personnalisée, canal recommandé, objections avec réponses, timing idéal et piège à éviter. Le tout exportable en Excel.",
      },
      {
        q: "À qui s'adresse REVORA ?",
        r: "REVORA est conçu pour les SDR, BDR, Account Executives et équipes commerciales B2B qui font de la prospection outbound. Si tu gères des fichiers de leads et que tu passes du temps à préparer tes approches, REVORA te fait gagner plusieurs heures par semaine.",
      },
      {
        q: "Quelle IA est utilisée pour le scoring ?",
        r: "REVORA utilise Google Gemini 2.5 Flash, un des modèles de langage les plus performants du marché. Le prompt système a été conçu et calibré spécifiquement pour la prospection B2B — ce n'est pas un usage générique de l'IA, c'est un outil métier.",
      },
      {
        q: "Les briefs sont-ils vraiment personnalisés ?",
        r: "Oui. Pour chaque lead, REVORA analyse le titre de poste, l'entreprise, le secteur, la taille, et les croise avec ton ICP (problèmes cibles, taille de deal, cycle de vente). La première phrase d'ouverture est rédigée pour ce contact précis — pas un template.",
      },
    ],
  },
  {
    title: "Données & sécurité",
    items: [
      {
        q: "Mes fichiers CSV sont-ils stockés sur vos serveurs ?",
        r: "Les leads uploadés sont traités en temps réel via l'API Gemini pour le scoring. Les résultats (briefs, scores) sont stockés dans Firestore, associés uniquement à ton compte. Chaque utilisateur est isolé — personne d'autre ne peut voir tes données.",
      },
      {
        q: "Mes données sont-elles utilisées pour entraîner l'IA ?",
        r: "Non. Les appels à l'API Gemini se font via un abonnement professionnel qui exclut explicitement l'utilisation des données pour l'entraînement des modèles. Tes leads ne servent pas à améliorer l'IA de Google.",
      },
      {
        q: "REVORA est-il conforme au RGPD ?",
        r: "Oui. REVORA applique le principe de minimisation des données, chiffre les communications (TLS), isole les données par utilisateur via Firestore security rules, et te permet d'exercer tes droits RGPD (accès, rectification, suppression) sur simple demande à privacy@revora.app.",
      },
      {
        q: "Qui a accès à mes données ?",
        r: "Seulement toi. L'équipe REVORA peut accéder aux données de compte (email, entreprise) pour le support, mais pas à tes analyses ou fichiers de leads. Aucun partage avec des tiers à des fins commerciales.",
      },
    ],
  },
  {
    title: "Utilisation",
    items: [
      {
        q: "Quels formats de fichiers sont supportés ?",
        r: "REVORA accepte les fichiers CSV (UTF-8 ou Latin-1, séparateur virgule ou point-virgule). La détection des colonnes est automatique et tolérante aux variantes de nommage (Prénom / FirstName / First Name, etc.). Un aperçu du mapping est affiché avant l'analyse.",
      },
      {
        q: "Combien de leads puis-je analyser par fichier ?",
        r: "Le maximum par analyse est de 200 leads. Si ton fichier en contient plus, les 200 premiers sont gardés. Pour des volumes plus importants, tu peux lancer plusieurs analyses ou nous contacter pour un accès Scale.",
      },
      {
        q: "Combien de temps prend une analyse ?",
        r: "Une analyse de 200 leads prend généralement entre 3 et 8 minutes. Les leads sont traités par batches de 5 en parallèle côté serveur. Une barre de progression en temps réel t'indique l'avancement.",
      },
      {
        q: "Que se passe-t-il si un lead échoue ?",
        r: "En cas d'erreur sur un lead (timeout API, réponse incomplète), REVORA retente automatiquement jusqu'à 2 fois. Si l'erreur persiste, le lead est marqué en erreur dans le tableau avec un bouton de retry manuel.",
      },
      {
        q: "L'export Excel est-il inclus ?",
        r: "Oui, l'export Excel est inclus dans tous les plans. Le fichier généré inclut la mise en forme conditionnelle (couleurs GO/MAYBE/SKIP/VETO), les briefs complets et toutes les données brutes du CSV d'origine.",
      },
    ],
  },
  {
    title: "Compte & facturation",
    items: [
      {
        q: "Comment se passe l'accès à REVORA ?",
        r: "Tu crées un compte, vérifies ton email, puis un administrateur valide ton accès (généralement sous 24h ouvrées). Dès la validation, tu reçois un email de confirmation et tu peux commencer immédiatement.",
      },
      {
        q: "Y a-t-il un essai gratuit ?",
        r: "Oui. Le plan Pro inclut 14 jours d'essai gratuit, sans carte bancaire. Tu testes, tu valides sur tes vrais leads, et tu décides ensuite. Aucun engagement avant la fin de l'essai.",
      },
      {
        q: "Puis-je annuler mon abonnement à tout moment ?",
        r: "Oui. Les abonnements mensuels sont sans engagement. Tu peux résilier depuis ton espace ou en nous écrivant à support@revora.app. L'accès reste actif jusqu'à la fin de la période payée.",
      },
      {
        q: "Quels moyens de paiement acceptez-vous ?",
        r: "Carte bancaire (Visa, Mastercard, Amex) et virement SEPA pour les abonnements annuels. La facturation est gérée via Stripe — tes données de paiement ne transitent jamais par nos serveurs.",
      },
      {
        q: "Puis-je obtenir une facture ?",
        r: "Oui. Une facture est générée automatiquement à chaque paiement et envoyée à l'email de ton compte. Tu peux également les retrouver dans ton espace client.",
      },
    ],
  },
];

function FaqItem({ q, r }: { q: string; r: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium text-ink">{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-muted">{r}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="bg-grid absolute inset-0" />
      <div className="glow glow-violet drift -left-40 -top-20 h-[400px] w-[400px]" />

      <div className="relative mx-auto max-w-[800px] px-5 py-16">

        {/* Header */}
        <div className="reveal text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted">
            FAQ
          </span>
          <h1 className="font-display mt-5 text-4xl font-extrabold tracking-tight">
            <span className="text-gradient">Toutes les réponses</span>
            <br />
            <span className="text-ink">avant de te lancer.</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Tu ne trouves pas ta réponse ?{" "}
            <a href="mailto:support@revora.app" className="font-medium text-accent hover:opacity-80">
              Écris-nous
            </a>
            , on répond sous 4h ouvrées.
          </p>
        </div>

        {/* Sections */}
        <div className="reveal reveal-1 mt-14 flex flex-col gap-10">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="mb-1 font-mono text-xs uppercase tracking-widest text-accent">
                {section.title}
              </h2>
              <div className="rounded-xl border border-border bg-surface/30 px-6">
                {section.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} r={item.r} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="reveal reveal-2 mt-16 rounded-2xl border border-border bg-surface/40 p-10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Convaincu ?</p>
          <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-ink">
            Lance ta première analyse en moins de 5 minutes.
          </h2>
          <p className="mt-3 text-sm text-muted">14 jours gratuits, sans carte bancaire.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="btn-premium inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white"
            >
              Créer mon compte <ArrowRight size={14} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t border-border py-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5">
          <span className="font-display text-sm font-bold text-ink">REVORA</span>
          <div className="flex gap-6 text-xs text-muted">
            <Link href="/pricing" className="hover:text-ink transition-colors">Tarifs</Link>
            <Link href="/legal" className="hover:text-ink transition-colors">CGU</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Confidentialité</Link>
            <a href="mailto:support@revora.app" className="hover:text-ink transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}
