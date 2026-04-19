"use client";

import { useEffect, useMemo, useState } from "react";
import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";
import {
getAnalysis,
type Priority,
type StoredLead,
} from "../lib/revora-storage";

type ActiveFilter = "ALL" | Priority;

export default function AnalysisPage() {
const [headers, setHeaders] = useState<string[]>([]);
const [leads, setLeads] = useState<StoredLead[]>([]);
const [fileName, setFileName] = useState("");
const [updatedAt, setUpdatedAt] = useState("");
const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
const [searchTerm, setSearchTerm] = useState("");

useEffect(() => {
const data = getAnalysis();

if (!data) return;

setHeaders(data.headers);
setLeads(data.leads);
setFileName(data.fileName);
setUpdatedAt(data.updatedAt);
}, []);

const stats = useMemo(() => {
const go = leads.filter((lead) => lead.priority === "GO").length;
const maybe = leads.filter((lead) => lead.priority === "MAYBE").length;
const skip = leads.filter((lead) => lead.priority === "SKIP").length;
const average =
leads.length > 0
? Math.round(
leads.reduce((sum, lead) => sum + lead.leadScore, 0) / leads.length
)
: 0;

return { go, maybe, skip, average };
}, [leads]);

const filteredLeads = useMemo(() => {
const normalized = searchTerm.toLowerCase().trim();

return leads.filter((lead) => {
const matchesFilter =
activeFilter === "ALL" ? true : lead.priority === activeFilter;

if (!matchesFilter) return false;
if (!normalized) return true;

const haystack = [
...lead.originalRow,
lead.fitReason,
lead.whyNow,
lead.probableBusinessPains,
lead.detectedOpportunities,
lead.bestOutreachChannel,
lead.channelReason,
lead.emailIdea,
lead.linkedinIdea,
lead.callOpener,
lead.nextBestAction,
]
.join(" ")
.toLowerCase();

return haystack.includes(normalized);
});
}, [leads, activeFilter, searchTerm]);

function getPriorityClasses(priority: Priority) {
if (priority === "GO") {
return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30";
}

if (priority === "MAYBE") {
return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30";
}

return "bg-slate-500/15 text-slate-300 ring-1 ring-white/10";
}

function getFilterButtonClasses(filter: ActiveFilter) {
const isActive = activeFilter === filter;

if (isActive) {
return "border-cyan-400/50 bg-cyan-400/15 text-cyan-200";
}

return "border-white/10 bg-white/5 text-white/65 hover:bg-white/10";
}

return (
<ProtectedPage>
<main className="min-h-screen bg-slate-950 text-white">
<TopNav />

<div className="mx-auto max-w-[1600px] px-6 py-8">
<section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Analysis
</p>

<h1 className="mt-3 text-4xl font-semibold text-white">
Analyse pipeline
</h1>

<p className="mt-4 max-w-3xl text-white/70">
Cette page lit maintenant les vraies données enregistrées depuis le
dashboard.
</p>

<div className="mt-6 grid gap-4 md:grid-cols-4">
<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm text-white/50">Score moyen</p>
<p className="mt-2 text-3xl font-semibold text-white">
{stats.average}
</p>
</div>

<div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
<p className="text-sm text-emerald-300">GO</p>
<p className="mt-2 text-3xl font-semibold text-white">
{stats.go}
</p>
</div>

<div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
<p className="text-sm text-amber-300">MAYBE</p>
<p className="mt-2 text-3xl font-semibold text-white">
{stats.maybe}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm text-white/50">SKIP</p>
<p className="mt-2 text-3xl font-semibold text-white">
{stats.skip}
</p>
</div>
</div>

<div className="mt-6 text-sm text-white/50">
Fichier source : {fileName || "Aucune analyse enregistrée"} <br />
Dernière mise à jour : {updatedAt || "—"}
</div>
</section>

<section className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
<input
type="text"
placeholder="Rechercher entreprise, contact, canal, angle..."
value={searchTerm}
onChange={(event) => setSearchTerm(event.target.value)}
className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35 lg:max-w-xl"
/>

<div className="flex flex-wrap gap-2">
{(["ALL", "GO", "MAYBE", "SKIP"] as const).map((filter) => (
<button
key={filter}
type="button"
onClick={() => setActiveFilter(filter)}
className={`rounded-full border px-4 py-2 text-sm font-medium transition ${getFilterButtonClasses(
filter
)}`}
>
{filter}
</button>
))}
</div>
</div>

{leads.length === 0 ? (
<p className="text-white/60">
Aucune analyse enregistrée. Lance d’abord une analyse depuis le
dashboard.
</p>
) : (
<>
<div className="mb-4 text-sm text-white/55">
{filteredLeads.length} résultat(s) affiché(s)
</div>

<div className="overflow-auto rounded-3xl border border-white/10">
<table className="min-w-full border-collapse text-sm">
<thead className="bg-white/10 text-white">
<tr>
{headers.map((header, index) => (
<th
key={`${header}-${index}`}
className="px-4 py-3 text-left font-semibold"
>
{header}
</th>
))}
<th className="px-4 py-3 text-left font-semibold">Score</th>
<th className="px-4 py-3 text-left font-semibold">Priorité</th>
<th className="px-4 py-3 text-left font-semibold">Fit reason</th>
<th className="px-4 py-3 text-left font-semibold">Why now</th>
<th className="px-4 py-3 text-left font-semibold">Pains</th>
<th className="px-4 py-3 text-left font-semibold">
Opportunities
</th>
<th className="px-4 py-3 text-left font-semibold">
Best channel
</th>
<th className="px-4 py-3 text-left font-semibold">
Next best action
</th>
</tr>
</thead>

<tbody>
{filteredLeads.map((lead, rowIndex) => (
<tr
key={rowIndex}
className="border-b border-white/5 bg-white/[0.03] align-top text-white/80 odd:bg-white/[0.02]"
>
{headers.map((_, cellIndex) => (
<td key={cellIndex} className="px-4 py-3">
{lead.originalRow[cellIndex] ?? ""}
</td>
))}

<td className="px-4 py-3 font-semibold text-white">
{lead.leadScore}
</td>

<td className="px-4 py-3">
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
lead.priority
)}`}
>
{lead.priority}
</span>
</td>

<td className="px-4 py-3">{lead.fitReason}</td>
<td className="px-4 py-3">{lead.whyNow}</td>
<td className="px-4 py-3">{lead.probableBusinessPains}</td>
<td className="px-4 py-3">{lead.detectedOpportunities}</td>
<td className="px-4 py-3">{lead.bestOutreachChannel}</td>
<td className="px-4 py-3">{lead.nextBestAction}</td>
</tr>
))}
</tbody>
</table>
</div>
</>
)}
</section>
</div>
</main>
</ProtectedPage>
);
}