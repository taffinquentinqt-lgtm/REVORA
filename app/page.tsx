import Link from "next/link";
import ContactForm from "./components/ContactForm";

export default function HomePage() {
return (
<main className="min-h-screen bg-slate-950 text-white">
<section className="relative overflow-hidden border-b border-white/10">
<div
className="absolute inset-0 bg-cover bg-center"
style={{ backgroundImage: "url('/revora-hero.jpg')" }}
/>
<div className="absolute inset-0 bg-slate-950/80" />
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.28),transparent_28%),radial-gradient(circle_at_left,rgba(34,211,238,0.18),transparent_22%)]" />

<div className="relative mx-auto max-w-7xl px-6 pb-24 pt-8">
<header className="flex items-center justify-between">
<div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-xl">
<span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
<span className="text-sm font-medium text-white/90">REVORA</span>
</div>

<div className="flex items-center gap-3">
<Link
href="#contact"
className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10"
>
Contact
</Link>

<Link
href="/login"
className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10"
>
Connexion
</Link>
</div>
</header>

<div className="mt-24 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
<div>
<p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Sales intelligence platform
</p>

<h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl">
Transforme une base de leads en
<span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
{" "}
plan d’action commercial.
</span>
</h1>

<p className="mt-6 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
REVORA aide les équipes commerciales B2B à analyser, prioriser
et exploiter leurs leads plus intelligemment. Score, priorité,
angle d’approche, canal recommandé et next best action.
</p>

<div className="mt-8 flex flex-wrap gap-3">
<Link
href="/login"
className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
>
Accéder à REVORA
</Link>

<Link
href="/analysis"
className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white/85 transition hover:bg-white/10"
>
Voir l’analyse
</Link>
</div>

<div className="mt-10 flex flex-wrap gap-3">
<div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-xl">
Lead scoring
</div>
<div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-xl">
Priorisation GO / MAYBE / SKIP
</div>
<div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-xl">
Export enrichi
</div>
</div>
</div>

<div className="grid gap-4">
<div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-2xl">
<p className="text-sm text-white/60">Ce que fait REVORA</p>
<div className="mt-4 grid gap-3">
<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="font-medium text-white">Scorer les leads</p>
<p className="mt-1 text-sm text-white/60">
Priorise les contacts selon leur potentiel commercial.
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="font-medium text-white">Préparer l’action</p>
<p className="mt-1 text-sm text-white/60">
Suggère l’angle, le canal et la prochaine action.
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="font-medium text-white">Exporter vite</p>
<p className="mt-1 text-sm text-white/60">
Génère des fichiers exploitables par une équipe sales.
</p>
</div>
</div>
</div>

<div className="grid gap-4 sm:grid-cols-3">
<div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-emerald-300">
GO
</p>
<p className="mt-2 text-2xl font-semibold text-white">Hot</p>
</div>

<div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-amber-300">
MAYBE
</p>
<p className="mt-2 text-2xl font-semibold text-white">Warm</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/60">
SKIP
</p>
<p className="mt-2 text-2xl font-semibold text-white">Low fit</p>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="mx-auto max-w-7xl px-6 py-20">
<div className="mb-12 text-center">
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

<div className="grid gap-6 md:grid-cols-3">
<div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
<p className="text-lg font-semibold text-white">Prioriser</p>
<p className="mt-3 text-sm leading-7 text-white/65">
Identifier plus vite les leads qui méritent vraiment du temps
commercial maintenant.
</p>
</div>

<div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
<p className="text-lg font-semibold text-white">Structurer</p>
<p className="mt-3 text-sm leading-7 text-white/65">
Donner un cadre clair à la prospection : score, priorité, canal et
next best action.
</p>
</div>

<div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
<p className="text-lg font-semibold text-white">Exécuter</p>
<p className="mt-3 text-sm leading-7 text-white/65">
Exporter rapidement un fichier enrichi prêt à être utilisé par une
équipe SDR, Biz Dev ou AE.
</p>
</div>
</div>
</section>

<section id="contact" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-20">
<div className="grid gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
<div>
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Contact
</p>
<h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
Parle-nous de ton besoin
</h2>
<p className="mt-4 max-w-xl text-white/65">
Envoie un message a l&apos;equipe REVORA. Il sera adresse a
qtntfnns@gmail.com.
</p>
<a
href="https://www.linkedin.com/company/revorabiz/"
target="_blank"
rel="noreferrer"
className="mt-6 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
>
LinkedIn REVORA
</a>
</div>

<ContactForm />
</div>
</section>

<section className="mx-auto max-w-7xl px-6 pb-20">
<div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Get started
</p>
<h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
Lance REVORA et analyse ton pipeline
</h2>
<p className="mx-auto mt-4 max-w-2xl text-white/65">
Upload ton CSV, règle tes seuils, analyse tes leads et récupère un
export enrichi dans le dashboard.
</p>

<div className="mt-8 flex justify-center">
<Link
href="/login"
className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
>
Se connecter
</Link>
</div>
</div>
</section>
</main>
);
}
