"use client";

import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";

export default function AnalysisPage() {
return (
<ProtectedPage>
<main className="min-h-screen bg-slate-950 text-white">
<TopNav />

<div className="mx-auto max-w-7xl px-6 py-10">
<div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
REVORA
</p>

<h1 className="mt-4 text-3xl font-semibold text-white">
Analysis
</h1>

<p className="mt-3 max-w-2xl text-white/70">
Cette page est active. Le moteur d’analyse API doit être dans
app/api/analyze/route.ts.
</p>
</div>
</div>
</main>
</ProtectedPage>
);
}
