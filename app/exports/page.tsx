"use client";

import { useEffect, useMemo, useState } from "react";
import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";
import { getExports, type StoredExportItem } from "../lib/revora-storage";

export default function ExportsPage() {
const [exportsList, setExportsList] = useState<StoredExportItem[]>([]);
const [searchTerm, setSearchTerm] = useState("");

useEffect(() => {
setExportsList(getExports());
}, []);

const stats = useMemo(() => {
const ready = exportsList.filter((item) => item.status === "READY").length;
const processing = exportsList.filter(
(item) => item.status === "PROCESSING"
).length;
const archived = exportsList.filter(
(item) => item.status === "ARCHIVED"
).length;
const totalLeads = exportsList.reduce(
(sum, item) => sum + item.leadCount,
0
);

return {
ready,
processing,
archived,
totalLeads,
};
}, [exportsList]);

const filteredExports = useMemo(() => {
const normalized = searchTerm.toLowerCase().trim();

return exportsList.filter((item) => {
if (!normalized) return true;

const haystack = [
item.fileName,
item.format,
item.status,
item.createdAt,
item.type,
]
.join(" ")
.toLowerCase();

return haystack.includes(normalized);
});
}, [exportsList, searchTerm]);

function getStatusClasses(status: StoredExportItem["status"]) {
if (status === "READY") {
return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30";
}

if (status === "PROCESSING") {
return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30";
}

return "bg-slate-500/15 text-slate-300 ring-1 ring-white/10";
}

return (
<ProtectedPage>
<main className="min-h-screen bg-slate-950 text-white">
<TopNav />

<div className="mx-auto max-w-[1600px] px-6 py-8">
<section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Exports
</p>

<h1 className="mt-3 text-4xl font-semibold text-white">
Exports & fichiers
</h1>

<p className="mt-4 max-w-3xl text-white/70">
Cette page lit maintenant le vrai historique des exports enregistrés
depuis le dashboard.
</p>

<div className="mt-8 grid gap-4 md:grid-cols-4">
<div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
<p className="text-sm text-emerald-300">Ready</p>
<p className="mt-2 text-3xl font-semibold text-white">
{stats.ready}
</p>
</div>

<div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
<p className="text-sm text-amber-300">Processing</p>
<p className="mt-2 text-3xl font-semibold text-white">
{stats.processing}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm text-white/50">Archived</p>
<p className="mt-2 text-3xl font-semibold text-white">
{stats.archived}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm text-white/50">Leads exportés</p>
<p className="mt-2 text-3xl font-semibold text-white">
{stats.totalLeads}
</p>
</div>
</div>
</section>

<section className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
<div>
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Export history
</p>
<h2 className="mt-2 text-2xl font-semibold text-white">
Historique des fichiers
</h2>
</div>

<input
type="text"
placeholder="Rechercher un export..."
value={searchTerm}
onChange={(event) => setSearchTerm(event.target.value)}
className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35 lg:max-w-sm"
/>
</div>

{exportsList.length === 0 ? (
<p className="text-white/60">
Aucun export enregistré. Télécharge d’abord un CSV enrichi depuis
le dashboard.
</p>
) : (
<>
<div className="grid gap-4">
{filteredExports.map((item, index) => (
<div
key={index}
className="rounded-2xl border border-white/10 bg-white/5 p-5"
>
<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
<div>
<p className="text-lg font-semibold text-white">
{item.fileName}
</p>
<p className="mt-2 text-sm text-white/55">{item.type}</p>
<p className="mt-1 text-sm text-white/55">
{item.createdAt}
</p>
</div>

<div className="flex flex-wrap items-center gap-2">
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
{item.format}
</span>
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
item.status
)}`}
>
{item.status}
</span>
</div>
</div>

<div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
<p className="text-sm text-white/65">
{item.leadCount} lead(s) dans cet export
</p>

<div className="flex flex-wrap gap-2">
<button
type="button"
className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/15"
>
Télécharger
</button>

<button
type="button"
className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10"
>
Voir détails
</button>
</div>
</div>
</div>
))}
</div>

<p className="mt-5 text-sm text-white/45">
{filteredExports.length} export(s) affiché(s)
</p>
</>
)}
</section>
</div>
</main>
</ProtectedPage>
);
}
