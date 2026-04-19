"use client";

import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";
import {
getDefaultSettings,
getSettings,
saveSettings,
} from "../lib/revora-storage";

export default function SettingsPage() {
const defaults = getDefaultSettings();

const [goThreshold, setGoThreshold] = useState(defaults.goThreshold);
const [maybeThreshold, setMaybeThreshold] = useState(defaults.maybeThreshold);
const [includeLinkedin, setIncludeLinkedin] = useState(defaults.includeLinkedin);
const [includePhone, setIncludePhone] = useState(defaults.includePhone);
const [exportFormat, setExportFormat] = useState(defaults.exportFormat);
const [saveHistory, setSaveHistory] = useState(defaults.saveHistory);
const [message, setMessage] = useState("");

useEffect(() => {
const settings = getSettings();
setGoThreshold(settings.goThreshold);
setMaybeThreshold(settings.maybeThreshold);
setIncludeLinkedin(settings.includeLinkedin);
setIncludePhone(settings.includePhone);
setExportFormat(settings.exportFormat);
setSaveHistory(settings.saveHistory);
}, []);

function handleSave() {
if (maybeThreshold >= goThreshold) {
setMessage("Le seuil MAYBE doit être inférieur au seuil GO.");
return;
}

saveSettings({
goThreshold,
maybeThreshold,
includeLinkedin,
includePhone,
exportFormat,
saveHistory,
});

setMessage("Paramètres sauvegardés ✅");
}

function handleReset() {
const settings = getDefaultSettings();
setGoThreshold(settings.goThreshold);
setMaybeThreshold(settings.maybeThreshold);
setIncludeLinkedin(settings.includeLinkedin);
setIncludePhone(settings.includePhone);
setExportFormat(settings.exportFormat);
setSaveHistory(settings.saveHistory);
saveSettings(settings);
setMessage("Paramètres réinitialisés ✅");
}

return (
<ProtectedPage>
<main className="min-h-screen bg-slate-950 text-white">
<TopNav />

<div className="mx-auto max-w-[1600px] px-6 py-8">
<section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Settings
</p>

<h1 className="mt-3 text-4xl font-semibold text-white">
Paramètres REVORA
</h1>

<p className="mt-4 max-w-3xl text-white/70">
Ces réglages influencent maintenant réellement le dashboard et les
exports.
</p>
</section>

<section className="mt-8 grid gap-8 xl:grid-cols-2">
<div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Scoring rules
</p>

<h2 className="mt-3 text-2xl font-semibold text-white">
Seuils de priorité
</h2>

<div className="mt-6 grid gap-5">
<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<div className="flex items-center justify-between gap-4">
<div>
<p className="font-medium text-white">Seuil GO</p>
<p className="mt-1 text-sm text-white/55">
À partir de quel score un lead passe en GO
</p>
</div>
<span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
{goThreshold}
</span>
</div>

<input
type="range"
min="50"
max="95"
value={goThreshold}
onChange={(e) => setGoThreshold(Number(e.target.value))}
className="mt-4 w-full"
/>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<div className="flex items-center justify-between gap-4">
<div>
<p className="font-medium text-white">Seuil MAYBE</p>
<p className="mt-1 text-sm text-white/55">
À partir de quel score un lead passe en MAYBE
</p>
</div>
<span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-300">
{maybeThreshold}
</span>
</div>

<input
type="range"
min="20"
max="70"
value={maybeThreshold}
onChange={(e) => setMaybeThreshold(Number(e.target.value))}
className="mt-4 w-full"
/>
</div>
</div>
</div>

<div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Analysis preferences
</p>

<h2 className="mt-3 text-2xl font-semibold text-white">
Préférences d’analyse
</h2>

<div className="mt-6 grid gap-4">
<button
type="button"
onClick={() => setIncludeLinkedin(!includeLinkedin)}
className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 text-left"
>
<div>
<p className="font-medium text-white">Prendre LinkedIn en compte</p>
<p className="mt-1 text-sm text-white/55">
Valoriser les profils LinkedIn présents dans le scoring
</p>
</div>
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${
includeLinkedin
? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
: "bg-slate-500/15 text-slate-300 ring-1 ring-white/10"
}`}
>
{includeLinkedin ? "Activé" : "Désactivé"}
</span>
</button>

<button
type="button"
onClick={() => setIncludePhone(!includePhone)}
className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 text-left"
>
<div>
<p className="font-medium text-white">Prendre le téléphone en compte</p>
<p className="mt-1 text-sm text-white/55">
Valoriser la présence d’un numéro dans le lead scoring
</p>
</div>
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${
includePhone
? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
: "bg-slate-500/15 text-slate-300 ring-1 ring-white/10"
}`}
>
{includePhone ? "Activé" : "Désactivé"}
</span>
</button>
</div>
</div>
</section>

<section className="mt-8 grid gap-8 xl:grid-cols-2">
<div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Export preferences
</p>

<h2 className="mt-3 text-2xl font-semibold text-white">
Paramètres d’export
</h2>

<div className="mt-6 grid gap-5">
<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<label className="block text-sm font-medium text-white">
Format par défaut
</label>

<select
value={exportFormat}
onChange={(e) => setExportFormat(e.target.value)}
className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
>
<option value="CSV">CSV</option>
<option value="XLSX">XLSX</option>
<option value="JSON">JSON</option>
</select>
</div>

<button
type="button"
onClick={() => setSaveHistory(!saveHistory)}
className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 text-left"
>
<div>
<p className="font-medium text-white">Sauvegarder l’historique</p>
<p className="mt-1 text-sm text-white/55">
Conserver une trace des exports générés
</p>
</div>
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${
saveHistory
? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
: "bg-slate-500/15 text-slate-300 ring-1 ring-white/10"
}`}
>
{saveHistory ? "Activé" : "Désactivé"}
</span>
</button>
</div>
</div>

<div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Current config
</p>

<h2 className="mt-3 text-2xl font-semibold text-white">
Configuration actuelle
</h2>

<div className="mt-6 grid gap-4">
<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm text-white/50">GO threshold</p>
<p className="mt-2 text-xl font-semibold text-white">
{goThreshold}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm text-white/50">MAYBE threshold</p>
<p className="mt-2 text-xl font-semibold text-white">
{maybeThreshold}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm text-white/50">Format export</p>
<p className="mt-2 text-xl font-semibold text-white">
{exportFormat}
</p>
</div>
</div>

<div className="mt-6 flex flex-wrap gap-3">
<button
type="button"
onClick={handleSave}
className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/15"
>
Sauvegarder les paramètres
</button>

<button
type="button"
onClick={handleReset}
className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
>
Réinitialiser
</button>
</div>

{message && <p className="mt-4 text-sm text-cyan-300">{message}</p>}
</div>
</section>
</div>
</main>
</ProtectedPage>
);
}
