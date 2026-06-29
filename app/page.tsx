import Link from "next/link";
import {
  Target,
  MessageSquareQuote,
  ShieldAlert,
  Sparkles,
  User,
  AlertTriangle,
  Upload,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { CtaPrimary, AuthSecondaryLink } from "@/components/ui/LandingCta";
import { Logo } from "@/components/ui/Logo";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { ScoringRadar } from "@/components/ui/ScoringRadar";
import { ConfidenceSignal } from "@/components/ui/ConfidenceSignal";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const STEPS = [
  {
    icon: Upload,
    n: "01",
    title: "Charge ton CSV",
    text: "Tes leads exportés de LinkedIn, Apollo ou ton CRM. Prénom, poste et entreprise suffisent pour démarrer.",
  },
  {
    icon: SlidersHorizontal,
    n: "02",
    title: "Décris ton ICP",
    text: "Ta cible idéale : secteur, taille, problème que tu résous. REVORA s'en sert pour scorer juste, pas au hasard.",
  },
  {
    icon: FileText,
    n: "03",
    title: "Reçois un brief par lead",
    text: "Score décomposé, angle d'approche, première phrase, objections, timing et piège — exportable en Excel.",
  },
];

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

/** Mini-carte de lead flottante (décoratif, fond de hero). */
function FloatCard({
  className = "",
  name,
  sub,
  kind,
  score,
  c,
}: {
  className?: string;
  name: string;
  sub: string;
  kind: string;
  score: number;
  c: string;
}) {
  return (
    <div className={`absolute w-[150px] rounded-lg border border-border bg-surface/70 p-2.5 opacity-[0.15] backdrop-blur ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink">{name}</span>
        <span
          className="rounded-[3px] border px-1 py-0.5 font-mono text-[8px] font-bold uppercase"
          style={{ color: c, borderColor: c, backgroundColor: `${c}1f` }}
        >
          {kind}
        </span>
      </div>
      <p className="mt-0.5 text-[9px] text-muted">{sub}</p>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: c }} />
      </div>
    </div>
  );
}

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

/** Chiffre clé de la bande de preuve sociale. */
function Stat({ value, label, sub, accent }: { value: string; label: string; sub?: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className={`font-display text-3xl font-extrabold tracking-tight md:text-4xl ${accent ? "text-accent2" : "text-ink"}`}>
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-ink">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Anatomie d'un brief — la profondeur réelle d'une analyse, pas juste un score. */
function BriefShowcase() {
  const scoring = {
    fit_titre: { note: 9, raison: "CDO — décideur direct sur la donnée" },
    fit_secteur: { note: 9, raison: "Scale-up data, cœur de cible" },
    fit_taille: { note: 8, raison: "180 personnes — budget et besoin réels" },
    fit_probleme: { note: 8, raison: "Dette technique data citée publiquement" },
  };
  const reasons = [
    { label: "Titre", note: scoring.fit_titre.note, raison: scoring.fit_titre.raison },
    { label: "Secteur", note: scoring.fit_secteur.note, raison: scoring.fit_secteur.raison },
    { label: "Taille", note: scoring.fit_taille.note, raison: scoring.fit_taille.raison },
    { label: "Problème", note: scoring.fit_probleme.note, raison: scoring.fit_probleme.raison },
  ];
  return (
    <div className="border-gradient glass rounded-xl p-1.5">
      <div className="rounded-lg bg-surface/80 p-5">
        {/* En-tête lead */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-ink">Marie Dupont</p>
            <p className="mt-0.5 truncate text-xs text-muted">CDO · Acme Data · 180 pers.</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="rounded-[4px] border border-go/60 bg-go/10 px-2 py-0.5 font-mono text-xs font-bold text-go">
              GO · 88
            </span>
            <ConfidenceSignal confidence="haute" />
          </div>
        </div>

        {/* Scoring décomposé */}
        <div className="border-b border-border py-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
            Scoring détaillé — pourquoi ce score, axe par axe
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <ScoringRadar scoring={scoring} score={88} size={200} />
            <div className="flex w-full flex-col gap-2">
              {reasons.map((a) => (
                <div key={a.label} className="flex items-baseline gap-2 text-xs">
                  <span className="w-16 shrink-0 text-muted">{a.label}</span>
                  <span className="w-8 shrink-0 font-mono text-ink">{a.note}/10</span>
                  <span className="flex-1 text-muted/80">{a.raison}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Persona */}
        <div className="border-b border-border py-4">
          <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            <User size={11} /> Qui est ce contact
          </p>
          <p className="text-sm leading-relaxed text-ink/90">
            Marie arbitre en continu entre la dette technique de la donnée et les
            demandes métier. Sensible au temps gagné par ses équipes, pas au jargon outil.
          </p>
        </div>

        {/* Première phrase */}
        <div className="rounded-md border border-accent/40 bg-accent/10 p-3">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent">
            Première phrase — utilisable telle quelle
          </p>
          <p className="font-mono text-xs leading-relaxed text-ink">
            Marie, comment vous arbitrez aujourd&apos;hui entre la dette technique sur
            la donnée et les demandes métier qui s&apos;accumulent ?
          </p>
        </div>

        {/* Piège */}
        <div className="mt-3 flex gap-2 rounded-md border border-skip/30 bg-skip/5 p-3">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-skip" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-skip">Piège à éviter</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/90">
              Ne pas dérouler la démo produit d&apos;entrée : elle décroche si l&apos;échange
              commence par l&apos;outil au lieu de son arbitrage.
            </p>
          </div>
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

      {/* cartes de leads flottantes (décoratif, desktop only) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 hidden h-[640px] overflow-hidden lg:block">
        <FloatCard className="float-a left-[3%] top-[160px]" name="Marie D." sub="Acme Data" kind="GO" score={88} c="#00d4aa" />
        <FloatCard className="float-c right-[4%] top-[110px]" name="Tom G." sub="Vault Sec" kind="SKIP" score={34} c="#ff4d6d" />
        <FloatCard className="float-b right-[15%] top-[400px]" name="Léa B." sub="Northwind" kind="MAYBE" score={71} c="#f5a623" />
      </div>

      <main className="relative mx-auto max-w-[1180px] px-5">
        {/* HERO */}
        <section className="grid grid-cols-1 items-center gap-12 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <div>
            <div className="reveal flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent backdrop-blur">
                <Sparkles size={11} /> V2
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                Sales intelligence B2B
              </span>
            </div>

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

        {/* PREUVE — résultats mission pilote */}
        <section className="pb-8">
          <div className="border-gradient glass reveal rounded-2xl px-6 py-8">
            <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-widest text-muted">
              Résultats — première mission pilote, prospection à froid
            </p>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <Stat value="9" label="RDV générés" sub="sur la mission" accent />
              <Stat value="100" label="appels composés" sub="décrochés + non décrochés" />
              <Stat value="9 %" label="RDV par appel" sub="taux de conversion" />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <ScrollReveal>
        <section className="border-t border-border py-16">
          <div className="reveal mx-auto max-w-[640px] text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted">
              Comment ça marche
            </span>
            <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              Trois étapes.{" "}
              <span className="text-gradient">Zéro courbe d&apos;apprentissage.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              De ton fichier brut à un plan d&apos;appel par lead, en moins de deux minutes.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, n, title, text }, i) => (
              <div
                key={n}
                className={`border-gradient glass reveal reveal-${i + 1} rounded-xl p-6`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-elevated">
                    <Icon size={18} className="text-accent" />
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-muted/30">{n}</span>
                </div>
                <h3 className="font-display mt-4 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>
        </ScrollReveal>

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

        {/* PRODUCT SHOWCASE — anatomie d'un brief */}
        <ScrollReveal>
        <section className="border-t border-border py-16">
          <div className="reveal mx-auto max-w-[640px] text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted">
              Anatomie d&apos;un brief
            </span>
            <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              Pas un score opaque.{" "}
              <span className="text-gradient">Un brief que tu peux défendre.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Chaque lead est décortiqué axe par axe : pourquoi ce score, qui est le
              contact, quoi dire, et le piège à éviter. Rien de générique — tout est
              rattaché à ce lead précis.
            </p>
          </div>
          <div className="reveal reveal-2 mx-auto mt-10 max-w-[680px]">
            <BriefShowcase />
          </div>
        </section>
        </ScrollReveal>

        {/* EMAIL CAPTURE */}
        <ScrollReveal>
        <section className="pb-16">
          <div className="border-gradient glass reveal mx-auto max-w-[640px] rounded-2xl px-8 py-10 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Reste dans la boucle
            </p>
            <h2 className="font-display mt-3 text-xl font-extrabold tracking-tight text-ink md:text-2xl">
              Pas encore prêt à tester ?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              Laisse ton email — on t&apos;envoie un cas concret d&apos;analyse REVORA et les
              nouveautés produit. Zéro spam.
            </p>
            <div className="mt-6">
              <WaitlistForm source="landing" />
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* CLOSING CTA */}
        <ScrollReveal>
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
            <p className="relative mt-4 text-xs text-muted">
              À partir de <span className="font-medium text-ink">23€/mois</span> · 14 jours gratuits, sans carte ·{" "}
              <Link href="/pricing" className="text-accent transition-opacity hover:opacity-80">
                Voir les tarifs
              </Link>
            </p>
          </div>
        </section>
        </ScrollReveal>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1180px] px-5 py-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <Logo size={24} wordmarkClassName="text-base" v2 />
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
