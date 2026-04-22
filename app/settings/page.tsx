"use client";

import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";
import {
DEFAULT_BRIEF,
clearGeneratedProfile,
getClientBrief,
getGeneratedProfile,
saveClientBrief,
saveGeneratedProfile,
type RevoraClientBrief,
type RevoraGeneratedProfile,
} from "../lib/revora-profile";

export default function SettingsPage() {
const [brief, setBrief] = useState<RevoraClientBrief>(DEFAULT_BRIEF);
const [generatedProfile, setGeneratedProfile] =
useState<RevoraGeneratedProfile | null>(null);
const [message, setMessage] = useState("");
const [isGenerating, setIsGenerating] = useState(false);

useEffect(() => {
const savedBrief = getClientBrief();
const savedGeneratedProfile = getGeneratedProfile();

setBrief(savedBrief);

if (savedGeneratedProfile.productSummary) {
setGeneratedProfile(savedGeneratedProfile);
}
}, []);

function handleChange(
event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) {
const { name, value } = event.target;

setBrief((prev) => ({
...prev,
[name]: value,
}));
}

function handleSave(event: React.FormEvent<HTMLFormElement>) {
event.preventDefault();
saveClientBrief(brief);
setMessage("Brief enregistré ✅");
}

async function handleGenerateProfile() {
if (
!brief.offerDescription.trim() ||
!brief.problemSolved.trim() ||
!brief.targetCompanyTypes.trim() ||
!brief.targetRoles.trim()
) {
setMessage("Merci de remplir les 4 champs avant de générer le profil.");
return;
}

try {
setIsGenerating(true);
setMessage("");

saveClientBrief(brief);

const response = await fetch("/api/generate-profile", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify(brief),
});

const data = await response.json();

if (!response.ok) {
throw new Error(data.error || "Erreur lors de la génération.");
}

saveGeneratedProfile(data);
setGeneratedProfile(data);
setMessage("Profil d’analyse généré ✅");
} catch (error) {
console.error(error);
setMessage("Impossible de générer le profil d’analyse.");
} finally {
setIsGenerating(false);
}
}

function handleReset() {
setBrief(DEFAULT_BRIEF);
setGeneratedProfile(null);
saveClientBrief(DEFAULT_BRIEF);
clearGeneratedProfile();
setMessage("Profil réinitialisé ✅");
}

return (
<ProtectedPage>
<main className="min-h-screen bg-slate-950 text-white">
<TopNav />

<div className="mx-auto flex w-full max-w-[1300px] flex-col gap-8 px-6 py-8">
<section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/30">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_left,rgba(34,211,238,0.14),transparent_20%)]" />

<div className="relative p-8 md:p-10">
<p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Analysis setup
</p>

<h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
Configure ton
<span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
{" "}
analyse REVORA
</span>
</h1>

<p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
Définis ton offre et ta cible. REVORA génère ensuite un profil
d’analyse plus intelligent pour prioriser tes leads.
</p>
</div>
</section>

<section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
<section className="rounded-[32px] border border-white/10 bg-white p-7 text-slate-900 shadow-2xl shadow-slate-950/30">
<div className="mb-6">
<p className="text-sm font-medium text-blue-600">
Brief commercial
</p>
<h2 className="mt-1 text-2xl font-semibold">
Formulaire 4 champs
</h2>
<p className="mt-2 text-sm text-slate-500">
Décris simplement ton offre et ta cible. REVORA s’occupe
d’enrichir la logique d’analyse.
</p>
</div>

<form onSubmit={handleSave} className="grid gap-5">
<div className="grid gap-2">
<label
htmlFor="offerDescription"
className="text-sm font-semibold"
>
Que vendez-vous ?
</label>
<textarea
id="offerDescription"
name="offerDescription"
rows={3}
value={brief.offerDescription}
onChange={handleChange}
placeholder="Ex. Solution SaaS qui aide les équipes commerciales B2B à mieux qualifier et prioriser leurs leads."
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
/>
</div>

<div className="grid gap-2">
<label htmlFor="problemSolved" className="text-sm font-semibold">
Quel problème principal résolvez-vous ?
</label>
<textarea
id="problemSolved"
name="problemSolved"
rows={3}
value={brief.problemSolved}
onChange={handleChange}
placeholder="Ex. Les commerciaux perdent du temps sur des leads peu qualifiés et savent mal lesquels traiter en priorité."
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
/>
</div>

<div className="grid gap-2">
<label
htmlFor="targetCompanyTypes"
className="text-sm font-semibold"
>
Quel type d’entreprise ciblez-vous ?
</label>
<input
id="targetCompanyTypes"
name="targetCompanyTypes"
type="text"
value={brief.targetCompanyTypes}
onChange={handleChange}
placeholder="Ex. PME B2B, SaaS, cabinets de conseil, services tech."
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
/>
</div>

<div className="grid gap-2">
<label htmlFor="targetRoles" className="text-sm font-semibold">
Quels profils souhaitez-vous contacter ?
</label>
<input
id="targetRoles"
name="targetRoles"
type="text"
value={brief.targetRoles}
onChange={handleChange}
placeholder="Ex. Head of Sales, Directeur commercial, CEO, Business Developer."
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
/>
</div>

<div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
Le client donne la direction. REVORA affine ensuite la logique
d’analyse avec l’IA.
</div>

<div className="flex flex-wrap gap-3 pt-2">
<button
type="submit"
className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
>
Enregistrer le brief
</button>

<button
type="button"
onClick={handleGenerateProfile}
disabled={isGenerating}
className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
>
{isGenerating
? "Génération..."
: "Générer mon profil d’analyse"}
</button>

<button
type="button"
onClick={handleReset}
className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
>
Réinitialiser
</button>
</div>

{message && (
<div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
{message}
</div>
)}
</form>
</section>

<section className="rounded-[32px] border border-white/10 bg-white/5 p-7 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
<div className="mb-6">
<p className="text-sm font-medium text-cyan-300">
Profil enrichi
</p>
<h2 className="mt-1 text-2xl font-semibold text-white">
Résultat généré
</h2>
<p className="mt-2 text-sm text-white/60">
Ce bloc représente le profil d’analyse que REVORA utilisera
ensuite pour mieux interpréter les leads.
</p>
</div>

{!generatedProfile && (
<div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/65">
Remplis les 4 champs puis clique sur
<span className="mx-1 font-medium text-white">
Générer mon profil d’analyse
</span>
pour afficher le résultat ici.
</div>
)}

{generatedProfile && (
<div className="grid gap-4">
<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm font-medium text-cyan-300">
Produit compris
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.productSummary}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm font-medium text-cyan-300">
Problème résolu
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.problemSummary}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm font-medium text-cyan-300">
Promesse de valeur probable
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.valueProposition}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm font-medium text-cyan-300">
ICP probable
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.icpSummary}
</p>
</div>

<div className="grid gap-4 md:grid-cols-2">
<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm font-medium text-cyan-300">
Fonctions cibles
</p>
<div className="mt-3 flex flex-wrap gap-2">
{generatedProfile.targetFunctions.map((item, index) => (
<span
key={`${item}-${index}`}
className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85"
>
{item}
</span>
))}
</div>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm font-medium text-cyan-300">
Signaux d’achat recherchés
</p>
<div className="mt-3 flex flex-wrap gap-2">
{generatedProfile.buyingSignals.map((item, index) => (
<span
key={`${item}-${index}`}
className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85"
>
{item}
</span>
))}
</div>
</div>
</div>

<div className="grid gap-4 md:grid-cols-2">
<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm font-medium text-cyan-300">
Douleurs business plausibles
</p>
<ul className="mt-3 grid gap-2 text-sm leading-7 text-white/80">
{generatedProfile.businessPains.map((item, index) => (
<li key={`${item}-${index}`}>• {item}</li>
))}
</ul>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm font-medium text-cyan-300">
Angles commerciaux recommandés
</p>
<ul className="mt-3 grid gap-2 text-sm leading-7 text-white/80">
{generatedProfile.recommendedAngles.map((item, index) => (
<li key={`${item}-${index}`}>• {item}</li>
))}
</ul>
</div>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm font-medium text-cyan-300">
Logique de priorité retenue
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.priorityLogic}
</p>
</div>
</div>
)}
</section>
</section>
</div>
</main>
</ProtectedPage>
);
}
