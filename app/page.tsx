import Link from "next/link";
import {
  Target,
  MessageSquareQuote,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { CtaPrimary, AuthSecondaryLink } from "@/components/ui/LandingCta";

const FEATURES = [
  {
    icon: Target,
    title: "Brief expert, pas un score",
    text: "Ton ICP en entrée, un brief opérationnel en sortie — pour chaque lead.",
  },
  {
    icon: MessageSquareQuote,
    title: "La première phrase exacte",
    text: "À dire ou écrire, personnalisée au lead, utilisable telle quelle. Zéro template.",
  },
  {
    icon: ShieldAlert,
    title: "Le piège à éviter",
    text: "L'erreur classique sur ce profil précis — avant que tu la fasses.",
  },
];

/** Aperçu produit stylisé (statique) — vend le résultat sans capture d'écran. */
function PreviewCard() {
  const rows = [
    { name: "Marie Dupont", company: "Acme Data", score: 88, kind: "GO", w: "88%", c: "#00d4aa" },
    { name: "Léa Bernard", company: "Northwind", score: 71, kind: "MAYBE", w: "71%", c: "#f5a623" },
    { name: "Tom Garnier", company: "Vault Sec", score: 34, kind: "SKIP", w: "34%", c: "#ff4d6d" },
  ];
  return (
    <div className="border-gradient glass reveal reveal-3 rounded-xl p-1.5">
      <div className="rounded-lg bg-surface/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
            Campagne CDO · 3 leads
          </span>
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-accent2/40 bg-accent2/10 px-2 py-0.5 font-mono text-[10px] text-accent2">
            <Sparkles size={10} /> scoré
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-3 rounded-md border border-border bg-bg/50 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{r.name}</p>
                <p className="truncate text-xs text-muted">{r.company}</p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="font-mono text-sm tabular-nums" style={{ color: r.c }}>
                  {r.score}
                </span>
                <div className="h-1.5 w-[56px] overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full" style={{ width: r.w, backgroundColor: r.c }} />
                </div>
              </div>
              <span
                className="rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: r.c, borderColor: r.c, backgroundColor: `${r.c}1f` }}
              >
                {r.kind}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-md border border-accent/40 bg-accent/10 p-3">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent">
            Première phrase — utilisable telle quelle
          </p>
          <p className="font-mono text-xs leading-relaxed text-ink">
            Marie, comment vous arbitrez aujourd&apos;hui entre dette technique sur
            la donnée et les demandes métier qui s&apos;accumulent ?
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* ambient background */}
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[700px]" />
      <div className="glow glow-violet drift absolute -left-32 -top-24 h-[520px] w-[520px]" />
      <div className="glow glow-teal absolute right-0 top-40 h-[420px] w-[420px]" />

      <main className="relative mx-auto max-w-[1180px] px-5">
        {/* HERO */}
        <section className="grid grid-cols-1 items-center gap-12 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <div>
            <span className="reveal inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
              Sales intelligence B2B
            </span>

            <h1 className="font-display reveal reveal-1 mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-[3.25rem]">
              Charge ton CSV.{" "}
              <span className="text-gradient">
                REVORA te dit qui appeler, quoi dire,
              </span>{" "}
              et ce qu&apos;il ne faut pas rater.
            </h1>

            <p className="reveal reveal-2 mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
              Sales intelligence pour SDR et Biz Dev B2B. Scoring IA, angle
              d&apos;approche personnalisé, objections avec réponses, export Excel
              prêt à l&apos;emploi.
            </p>

            <div className="reveal reveal-3 mt-8 flex flex-wrap items-center gap-4">
              <CtaPrimary className="px-5 py-3 text-sm" />
              <AuthSecondaryLink />
            </div>

            <div className="reveal reveal-4 mt-8 flex items-center gap-3">
              <div className="flex -space-x-1">
                {["#00d4aa", "#6c63ff", "#f5a623"].map((c) => (
                  <span
                    key={c}
                    className="h-2.5 w-2.5 rounded-full ring-2 ring-bg"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="font-mono text-xs text-muted">
                <span className="text-accent2">9 RDV générés</span> sur la première
                mission pilote
              </p>
            </div>
          </div>

          <PreviewCard />
        </section>

        {/* FEATURES */}
        <section className="border-t border-border py-16">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className={`border-gradient glass reveal reveal-${i + 1} group rounded-xl p-6`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-elevated transition-colors group-hover:border-accent/50">
                  <Icon size={18} className="text-accent" />
                </div>
                <h3 className="font-display mt-4 text-base font-semibold text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="pb-24">
          <div className="border-gradient glass relative overflow-hidden rounded-2xl px-8 py-14 text-center">
            <div className="glow glow-violet absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2" />
            <h2 className="font-display relative text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              Arrête de scorer. Commence à briefer.
            </h2>
            <p className="relative mx-auto mt-3 max-w-lg text-sm text-muted">
              Un CSV, ton ICP, et chaque lead devient un plan d&apos;action
              opérationnel.
            </p>
            <CtaPrimary className="relative mt-7 px-6 py-3 text-sm" />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1180px] px-5 py-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-extrabold tracking-tight text-ink">REVORA</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">v2</span>
              </div>
              <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-muted">
                Sales intelligence B2B pour SDR et équipes commerciales. Brief expert à partir de ton CSV.
              </p>
            </div>

            <div className="flex flex-wrap gap-12 text-sm">
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Produit</p>
                <Link href="/pricing" className="text-muted transition-colors hover:text-ink">Tarifs</Link>
                <Link href="/faq" className="text-muted transition-colors hover:text-ink">FAQ</Link>
                <Link href="/login" className="text-muted transition-colors hover:text-ink">Se connecter</Link>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Légal</p>
                <Link href="/legal" className="text-muted transition-colors hover:text-ink">CGU</Link>
                <Link href="/privacy" className="text-muted transition-colors hover:text-ink">Confidentialité</Link>
                <a href="mailto:support@revora.app" className="text-muted transition-colors hover:text-ink">Contact</a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <p className="text-xs text-muted">© {new Date().getFullYear()} REVORA. Tous droits réservés.</p>
            <div className="flex gap-4 text-xs text-muted">
              <Link href="/legal" className="transition-colors hover:text-ink">CGU</Link>
              <Link href="/privacy" className="transition-colors hover:text-ink">Politique de confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
