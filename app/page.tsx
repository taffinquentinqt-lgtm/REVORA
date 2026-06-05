import Link from "next/link";
import ContactForm from "./components/ContactForm";

const LINKEDIN_URL = "https://www.linkedin.com/company/revorabiz/";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="revora-hero-image absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/revora-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(34,211,238,0.20),transparent_35%,rgba(16,185,129,0.12)),radial-gradient(circle_at_top_right,rgba(59,130,246,0.30),transparent_28%)]" />
        <div className="revora-scanlines absolute inset-0 opacity-30" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-8">
          <header className="revora-reveal flex items-center justify-between gap-4">
            <div className="revora-lift inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-xl">
              <span className="revora-pulse h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <span className="text-sm font-medium text-white/90">REVORA</span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className="revora-lift rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10"
              >
                LinkedIn
              </a>

              <Link
                href="#contact"
                className="revora-lift rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10"
              >
                Contact
              </Link>

              <Link
                href="/login"
                className="revora-lift rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10"
              >
                Connexion
              </Link>
            </div>
          </header>

          <div className="mt-24 grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="revora-reveal revora-reveal-delay-1">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
                Sales intelligence platform
              </p>

              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl">
                Transforme une base de leads en{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400 bg-clip-text text-transparent">
                  plan d&apos;action commercial.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
                REVORA aide les équipes commerciales B2B à
                analyser, prioriser et exploiter leurs leads plus
                intelligemment. Score, priorité, angle d&apos;approche,
                canal recommandé et next best action.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="revora-shine revora-lift rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Accéder à REVORA
                </Link>

                <Link
                  href="/analysis"
                  className="revora-lift rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                >
                  Voir l&apos;analyse
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                {["Lead scoring", "GO / MAYBE / SKIP", "Export enrichi"].map(
                  (label) => (
                    <div
                      key={label}
                      className="revora-lift rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-xl"
                    >
                      {label}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="revora-reveal revora-reveal-delay-2 grid gap-4">
              <div className="revora-float revora-glass revora-moving-band rounded-3xl border border-cyan-300/20 bg-white/10 p-6 backdrop-blur-2xl">
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/60">Analyse live</p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        CSV enrichi en cours
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      <span className="revora-pulse h-2 w-2 rounded-full bg-emerald-300" />
                      LIVE
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    <div className="revora-lift rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">
                          Lead enterprise
                        </p>
                        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                          GO
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="revora-progress h-full w-[92%] rounded-full bg-emerald-300" />
                      </div>
                      <p className="mt-2 text-xs text-white/55">
                        Score 92 · Email prioritaire
                      </p>
                    </div>

                    <div className="revora-lift rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">
                          Compte mid-market
                        </p>
                        <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">
                          MAYBE
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="revora-progress revora-progress-delay-1 h-full w-[66%] rounded-full bg-amber-300" />
                      </div>
                      <p className="mt-2 text-xs text-white/55">
                        Score 66 · Enrichir avant contact
                      </p>
                    </div>

                    <div className="revora-lift rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">Lead hors cible</p>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
                          SKIP
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="revora-progress revora-progress-delay-2 h-full w-[28%] rounded-full bg-white/45" />
                      </div>
                      <p className="mt-2 text-xs text-white/55">
                        Score 28 · Faible fit ICP
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="revora-lift rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-wider text-emerald-300">
                    GO
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">Hot</p>
                </div>

                <div className="revora-lift rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-wider text-amber-300">
                    MAYBE
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">Warm</p>
                </div>

                <div className="revora-lift rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-wider text-white/60">
                    SKIP
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    Low fit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="revora-reveal mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
            Why REVORA
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Un outil pensé pour la préparation commerciale
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/65">
            REVORA ne remplace pas un CRM. REVORA transforme une base brute en
            recommandations actionnables.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="revora-lift group rounded-[28px] border border-white/10 bg-white/5 p-7 backdrop-blur-xl transition-all hover:border-cyan-400/20 hover:bg-white/[0.07]">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-lg">
              ⚡
            </div>
            <p className="text-base font-semibold text-white">Prioriser</p>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Identifie en un coup d'œil les leads qui méritent ton temps
              maintenant. Score, GO / MAYBE / SKIP et logique de veto.
            </p>
          </div>

          <div className="revora-lift group rounded-[28px] border border-white/10 bg-white/5 p-7 backdrop-blur-xl transition-all hover:border-emerald-400/20 hover:bg-white/[0.07]">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-lg">
              🎯
            </div>
            <p className="text-base font-semibold text-white">Structurer</p>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Canal recommandé, angle d'approche, objections, questions à
              poser et next best action — pour chaque lead.
            </p>
          </div>

          <div className="revora-lift group rounded-[28px] border border-white/10 bg-white/5 p-7 backdrop-blur-xl transition-all hover:border-blue-400/20 hover:bg-white/[0.07]">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-lg">
              📤
            </div>
            <p className="text-base font-semibold text-white">Exécuter</p>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Export Excel enrichi prêt à l'emploi pour ton équipe SDR,
              Biz Dev ou AE — coloré par priorité.
            </p>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-20"
      >
        <div className="revora-glass revora-reveal grid gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Parle-nous de ton besoin
            </h2>
            <p className="mt-4 max-w-xl text-white/65">
              Envoie un message à l&apos;équipe REVORA. Il sera adressé à
              qtntfnns@gmail.com.
            </p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="revora-lift mt-6 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
            >
              LinkedIn REVORA
            </a>
          </div>

          <ContactForm />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="revora-glass revora-reveal rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
            Get started
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Lance REVORA et analyse ton pipeline
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/65">
            Upload ton CSV, regle tes seuils, analyse tes leads et recupere un
            export enrichi dans le dashboard.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="revora-shine revora-lift rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
