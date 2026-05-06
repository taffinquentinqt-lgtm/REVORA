"use client";

import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";
import { getExports, type StoredExport } from "../lib/revora-storage";

export default function ExportsPage() {
const [exportsList, setExportsList] = useState<StoredExport[]>([]);

useEffect(() => {
setExportsList(getExports());
}, []);

return (
<ProtectedPage>
<main className="revora-app-bg relative min-h-screen overflow-hidden text-white">
<TopNav />

<div className="relative mx-auto max-w-7xl px-6 py-10">
<div className="revora-glass revora-reveal rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
REVORA
</p>

<h1 className="mt-4 text-3xl font-semibold text-white">Exports</h1>

<p className="mt-3 text-white/70">
Retrouve ici l’historique de tes exports générés.
</p>

<div className="mt-8 grid gap-4">
{exportsList.length === 0 ? (
<div className="revora-lift rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
Aucun export disponible pour le moment.
</div>
) : (
exportsList.map((item, index) => (
<div
key={`${item.fileName}-${index}`}
className="revora-lift rounded-2xl border border-white/10 bg-white/5 p-5"
>
<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
<div>
<p className="text-lg font-semibold text-white">
{item.fileName}
</p>
<p className="mt-1 text-sm text-white/60">
{item.type} · {item.format}
</p>
</div>

<div className="text-sm text-white/60">
{item.createdAt}
</div>
</div>

<div className="mt-4 flex flex-wrap gap-2">
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
Statut : {item.status}
</span>
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
Leads : {item.leadCount}
</span>
</div>
</div>
))
)}
</div>
</div>
</div>
</main>
</ProtectedPage>
);
}
