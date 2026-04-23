"use client";

import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";
import {
getClientBrief,
getGeneratedProfile,
saveClientBrief,
saveGeneratedProfile,
type RevoraGeneratedProfile,
} from "../lib/revora-profile";

export default function SettingsPage() {
const [offerDescription, setOfferDescription] = useState("");
const [problemSolved, setProblemSolved] = useState("");
const [targetCompanyTypes, setTargetCompanyTypes] = useState("");
const [targetRoles, setTargetRoles] = useState("");

const [generatedProfile, setGeneratedProfile] =
useState<RevoraGeneratedProfile | null>(null);

const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState("");
const [successMessage, setSuccessMessage] = useState("");

useEffect(() => {
const brief = getClientBrief();
const profile = getGeneratedProfile();

setOfferDescription(brief.offerDescription || "");
setProblemSolved(brief.problemSolved || "");
setTargetCompanyTypes(brief.targetCompanyTypes || "");
setTargetRoles(brief.targetRoles || "");

if (profile.productSummary) {
setGeneratedProfile(profile);
}
}, []);

async function handleGenerateProfile() {
try {
setIsLoading(true);
setError("");
setSuccessMessage("");

const trimmedOfferDescription = offerDescription.trim();
const trimmedProblemSolved = problemSolved.trim();
const trimmedTargetCompanyTypes = targetCompanyTypes.trim();
const trimmedTargetRoles = targetRoles.trim();

if (
!trimmedOfferDescription ||
!trimmedProblemSolved ||
!trimmedTargetCompanyTypes ||
!trimmedTargetRoles
) {
setError("Tous les champs sont requis.");
return;
}

saveClientBrief({
offerDescription: trimmedOfferDescription,
problemSolved: trimmedProblemSolved,
targetCompanyTypes: trimmedTargetCompanyTypes,
targetRoles: trimmedTargetRoles,
});

const response = await fetch("/API/generate-profile", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
offerDescription: trimmedOfferDescription,
problemSolved: trimmedProblemSolved,
targetCompanyTypes: trimmedTargetCompanyTypes,
targetRoles: trimmedTargetRoles,
}),
});

const rawText = await response.text();

let data: any = {};
try {
data = rawText ? JSON.parse(rawText) : {};
} catch {
throw new Error(
`La route /API/generate-profile ne renvoie pas du JSON. Réponse reçue : ${rawText.slice(0, 200)}`
);
}

if (!response.ok) {
throw new Error(
data.error ||
JSON.stringify(data) ||
"Impossible de générer le profil d’analyse."
);
}

saveGeneratedProfile(data);
setGeneratedProfile(data);
setSuccessMessage("Profil d’analyse généré avec succès ✅");
} catch (err: any) {
console.error("handleGenerateProfile error:", err);
setError(err?.message || "Impossible de générer le profil d’analyse.");
} finally {
setIsLoading(false);
}
}

return (
<ProtectedPage>
<main className="min-h-screen bg-slate-950 text-white">
<TopNav />

<div className="mx-auto max-w-7xl px-6 py-8">
<div className="mb-8">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Paramètres REVORA
</p>
<h1 className="mt-3 text-3xl font-semibold md:text-5xl">
Générer mon profil d’analyse
</h1>
<p className="mt-4 max-w-3xl text-white/70">
Décris l’offre, le problème résolu, la cible et les profils visés.
REVORA construit ensuite un cadrage commercial enrichi.
</p>
</div>

<section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
<div className="rounded-[28px] border border-white/10 bg-white p-7 text-slate-900 shadow-2xl shadow-slate-950/30">
<div className="grid gap-5">
<div className="grid gap-2">
<label
htmlFor="offerDescription"
className="text-sm font-semibold"
>
Offre
</label>
<textarea
id="offerDescription"
value={offerDescription}
onChange={(event) => setOfferDescription(event.target.value)}
rows={4}
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
placeholder="Exemple : logiciel de prospection B2B, service de génération de pipeline, solution d’optimisation commerciale..."
/>
</div>

<div className="grid gap-2">
<label
htmlFor="problemSolved"
className="text-sm font-semibold"
>
Problème résolu
</label>
<textarea
id="problemSolved"
value={problemSolved}
onChange={(event) => setProblemSolved(event.target.value)}
rows={4}
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
placeholder="Exemple : aide les équipes sales à mieux prioriser leurs leads et à gagner du temps dans la qualification."
/>
</div>

<div className="grid gap-2">
<label
htmlFor="targetCompanyTypes"
className="text-sm font-semibold"
>
Types d’entreprises ciblés
</label>
<input
id="targetCompanyTypes"
type="text"
value={targetCompanyTypes}
onChange={(event) =>
setTargetCompanyTypes(event.target.value)
}
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
placeholder="Exemple : PME B2B, SaaS, agences, cabinets de conseil..."
/>
</div>

<div className="grid gap-2">
<label htmlFor="targetRoles" className="text-sm font-semibold">
Profils à contacter
</label>
<input
id="targetRoles"
type="text"
value={targetRoles}
onChange={(event) => setTargetRoles(event.target.value)}
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
placeholder="Exemple : CEO, Head of Sales, Directeur commercial, Responsable acquisition..."
/>
</div>

<button
type="button"
onClick={handleGenerateProfile}
disabled={isLoading}
className="mt-2 rounded-2xl bg-slate-950 px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
>
{isLoading
? "Génération en cours..."
: "Générer mon profil d’analyse"}
</button>

{error && (
<p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
{error}
</p>
)}

{successMessage && (
<p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
{successMessage}
</p>
)}
</div>
</div>

<div className="rounded-[28px] border border-white/10 bg-white/5 p-7 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Profil enrichi
</p>

{!generatedProfile ? (
<div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-white/60">
Aucun profil généré pour le moment.
</div>
) : (
<div className="mt-6 grid gap-4">
<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Produit compris
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.productSummary}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Problème résolu
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.problemSummary}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Promesse de valeur
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.valueProposition}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
ICP probable
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.icpSummary}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Fonctions cibles
</p>
<ul className="mt-2 grid gap-2 text-sm leading-7 text-white/80">
{generatedProfile.targetFunctions?.map((item, index) => (
<li key={`${item}-${index}`}>• {item}</li>
))}
</ul>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Signaux d’achat
</p>
<ul className="mt-2 grid gap-2 text-sm leading-7 text-white/80">
{generatedProfile.buyingSignals?.map((item, index) => (
<li key={`${item}-${index}`}>• {item}</li>
))}
</ul>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Douleurs business plausibles
</p>
<ul className="mt-2 grid gap-2 text-sm leading-7 text-white/80">
{generatedProfile.businessPains?.map((item, index) => (
<li key={`${item}-${index}`}>• {item}</li>
))}
</ul>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Angles recommandés
</p>
<ul className="mt-2 grid gap-2 text-sm leading-7 text-white/80">
{generatedProfile.recommendedAngles?.map((item, index) => (
<li key={`${item}-${index}`}>• {item}</li>
))}
</ul>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Logique de priorité
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{generatedProfile.priorityLogic}
</p>
</div>
</div>
)}
</div>
</section>
</div>
</main>
</ProtectedPage>
);
}
