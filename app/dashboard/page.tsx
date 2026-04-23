"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";
import { getSession, type RevoraPlan } from "../lib/revora-auth";
import {
getClientBrief,
getGeneratedProfile,
type RevoraGeneratedProfile,
} from "../lib/revora-profile";
import { getSettings, saveAnalysis, saveExport } from "../lib/revora-storage";

type FormDataState = {
companyName: string;
companyDescription: string;
offerDescription: string;
target: string;
};

type CsvPreview = {
headers: string[];
rows: string[][];
};

type Priority = "GO" | "MAYBE" | "SKIP";
type ActiveFilter = "ALL" | Priority;

type EnrichedLead = {
originalRow: string[];
leadScore: number;
priority: Priority;
fitReason: string;
whyNow: string;
probableBusinessPains: string;
detectedOpportunities: string;
bestOutreachChannel: string;
channelReason: string;
emailIdea: string;
linkedinIdea: string;
callOpener: string;
nextBestAction: string;
effortLevel: string;
confidenceLevel: string;
probableObjection: string;
objectionHandling: string;
opportunityLevel: string;
dealPotential: string;
painClarity: string;
urgencyLevel: string;
salesReadiness: string;
discoveryFocus: string;
questionsToAsk: string[];
valueHypothesis: string;
demoAngle: string;
handoffNote: string;
};

function getCurrentMonthKey() {
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
return `${year}-${month}`;
}

function getUsageStorageKey(email: string) {
return `revora_monthly_usage_${email.toLowerCase()}`;
}

function getMonthlyUsage(email: string) {
if (typeof window === "undefined") {
return {
monthKey: getCurrentMonthKey(),
usedLeads: 0,
};
}

const storageKey = getUsageStorageKey(email);
const raw = localStorage.getItem(storageKey);
const currentMonthKey = getCurrentMonthKey();

if (!raw) {
return {
monthKey: currentMonthKey,
usedLeads: 0,
};
}

try {
const parsed = JSON.parse(raw) as {
monthKey?: string;
usedLeads?: number;
};

if (parsed.monthKey !== currentMonthKey) {
return {
monthKey: currentMonthKey,
usedLeads: 0,
};
}

return {
monthKey: currentMonthKey,
usedLeads: Number(parsed.usedLeads) || 0,
};
} catch {
return {
monthKey: currentMonthKey,
usedLeads: 0,
};
}
}

function saveMonthlyUsage(email: string, usedLeads: number) {
if (typeof window === "undefined") return;

const storageKey = getUsageStorageKey(email);
localStorage.setItem(
storageKey,
JSON.stringify({
monthKey: getCurrentMonthKey(),
usedLeads,
})
);
}

export default function DashboardPage() {
const [formData, setFormData] = useState<FormDataState>({
companyName: "",
companyDescription: "",
offerDescription: "",
target: "",
});

const [csvFile, setCsvFile] = useState<File | null>(null);
const [message, setMessage] = useState("");
const [csvPreview, setCsvPreview] = useState<CsvPreview>({
headers: [],
rows: [],
});
const [isReadingCsv, setIsReadingCsv] = useState(false);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [enrichedLeads, setEnrichedLeads] = useState<EnrichedLead[]>([]);
const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
const [searchTerm, setSearchTerm] = useState("");
const [exportFormat, setExportFormat] = useState("CSV");

const [sessionEmail, setSessionEmail] = useState("");
const [sessionPlan, setSessionPlan] = useState<RevoraPlan>("demo");
const [sessionMonthlyLimit, setSessionMonthlyLimit] = useState<number | null>(
200
);
const [sessionIsUnlimited, setSessionIsUnlimited] = useState(false);
const [usedThisMonth, setUsedThisMonth] = useState(0);

const [generatedProfile, setGeneratedProfile] =
useState<RevoraGeneratedProfile | null>(null);

const [analysisProgress, setAnalysisProgress] = useState({
current: 0,
total: 0,
});

useEffect(() => {
const settings = getSettings();
setExportFormat(settings.exportFormat);

const session = getSession();

if (session) {
setSessionEmail(session.email);
setSessionPlan(session.plan);
setSessionMonthlyLimit(session.monthlyLimit);
setSessionIsUnlimited(session.isUnlimited);

const usage = getMonthlyUsage(session.email);
setUsedThisMonth(usage.usedLeads);
}

const brief = getClientBrief();
const profile = getGeneratedProfile();

if (profile.productSummary) {
setGeneratedProfile(profile);
}

setFormData({
companyName: "REVORA",
companyDescription: brief.problemSolved || "",
offerDescription: brief.offerDescription || "",
target: `${brief.targetCompanyTypes}${
brief.targetRoles ? ` | Profils cibles : ${brief.targetRoles}` : ""
}`,
});
}, []);

const rowCount = useMemo(() => csvPreview.rows.length, [csvPreview.rows]);

const remainingThisMonth = useMemo(() => {
if (sessionIsUnlimited || sessionMonthlyLimit === null) return null;
return Math.max(0, sessionMonthlyLimit - usedThisMonth);
}, [sessionIsUnlimited, sessionMonthlyLimit, usedThisMonth]);

const stats = useMemo(() => {
const go = enrichedLeads.filter((lead) => lead.priority === "GO").length;
const maybe = enrichedLeads.filter(
(lead) => lead.priority === "MAYBE"
).length;
const skip = enrichedLeads.filter((lead) => lead.priority === "SKIP").length;

return { go, maybe, skip };
}, [enrichedLeads]);

const averageScore = useMemo(() => {
if (enrichedLeads.length === 0) return 0;
const total = enrichedLeads.reduce((sum, lead) => sum + lead.leadScore, 0);
return Math.round(total / enrichedLeads.length);
}, [enrichedLeads]);

const filteredLeads = useMemo(() => {
const normalizedSearch = normalizeForSearch(searchTerm);

return enrichedLeads.filter((lead) => {
const matchesPriority =
activeFilter === "ALL" ? true : lead.priority === activeFilter;

if (!matchesPriority) return false;
if (!normalizedSearch) return true;

const haystack = normalizeForSearch(
[
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
lead.probableObjection,
lead.objectionHandling,
lead.opportunityLevel,
lead.dealPotential,
lead.painClarity,
lead.urgencyLevel,
lead.salesReadiness,
lead.discoveryFocus,
lead.questionsToAsk.join(" "),
lead.valueHypothesis,
lead.demoAngle,
lead.handoffNote,
].join(" ")
);

return haystack.includes(normalizedSearch);
});
}, [enrichedLeads, activeFilter, searchTerm]);

function normalizeCell(value: unknown): string {
if (value === null || value === undefined) return "";
return String(value).trim();
}

function normalizeForSearch(value: string): string {
return value
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function parseCsvText(text: string): CsvPreview {
const result = Papa.parse<string[]>(text, {
skipEmptyLines: true,
delimiter: "",
});

const data = result.data
.map((row) => row.map((cell) => normalizeCell(cell)))
.filter((row) => row.some((cell) => cell !== ""));

if (data.length === 0) {
return { headers: [], rows: [] };
}

return {
headers: data[0],
rows: data.slice(1),
};
}

async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
const file = event.target.files?.[0] ?? null;

if (!file) {
setCsvFile(null);
setCsvPreview({ headers: [], rows: [] });
setEnrichedLeads([]);
return;
}

if (!file.name.toLowerCase().endsWith(".csv")) {
setMessage("Merci d'uploader un fichier CSV.");
setCsvFile(null);
setCsvPreview({ headers: [], rows: [] });
setEnrichedLeads([]);
return;
}

try {
setIsReadingCsv(true);
setMessage("");

const text = await file.text();
const parsedCsv = parseCsvText(text);

setCsvFile(file);
setCsvPreview(parsedCsv);
setEnrichedLeads([]);

if (parsedCsv.headers.length === 0) {
setMessage("Le fichier CSV est vide ou illisible.");
return;
}

setMessage(
`CSV chargé avec succès 🚀 ${parsedCsv.rows.length} ligne(s) détectée(s).`
);
} catch (error) {
console.error("Erreur lecture CSV :", error);
setCsvFile(null);
setCsvPreview({ headers: [], rows: [] });
setEnrichedLeads([]);
setMessage("Impossible de lire le fichier CSV.");
} finally {
setIsReadingCsv(false);
}
}

async function handleAdvancedAnalysis() {
if (!generatedProfile) {
setMessage("Merci de générer d’abord le profil d’analyse dans Settings.");
return;
}

if (!csvFile || csvPreview.headers.length === 0 || csvPreview.rows.length === 0) {
setMessage("Merci d’ajouter un fichier CSV valide.");
return;
}

if (!sessionEmail) {
setMessage("Aucune session active détectée.");
return;
}

if (!sessionIsUnlimited && remainingThisMonth !== null && remainingThisMonth <= 0) {
setMessage(`Quota mensuel atteint pour le plan ${sessionPlan.toUpperCase()}.`);
return;
}

const allowedLeadCount = sessionIsUnlimited
? csvPreview.rows.length
: Math.min(csvPreview.rows.length, remainingThisMonth ?? 0);

const rowsToAnalyze = csvPreview.rows.slice(0, allowedLeadCount);

if (rowsToAnalyze.length === 0) {
setMessage("Aucune ligne disponible pour l’analyse.");
return;
}

const batchSize = 10;
const totalBatches = Math.ceil(rowsToAnalyze.length / batchSize);

try {
setIsAnalyzing(true);
setMessage("");
setEnrichedLeads([]);
setAnalysisProgress({
current: 0,
total: rowsToAnalyze.length,
});

const brief = getClientBrief();
const allResults: EnrichedLead[] = [];

for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
const start = batchIndex * batchSize;
const end = start + batchSize;
const batchRows = rowsToAnalyze.slice(start, end);

setMessage(
`Analyse en cours... lot ${batchIndex + 1}/${totalBatches} (${Math.min(
start + 1,
rowsToAnalyze.length
)} à ${Math.min(end, rowsToAnalyze.length)} / ${rowsToAnalyze.length})`
);

const response = await fetch("/API/analyze-csv", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
brief: {
...brief,
offerDescription: formData.offerDescription,
problemSolved: formData.companyDescription,
targetCompanyTypes: formData.target,
targetRoles: brief.targetRoles,
},
generatedProfile,
headers: csvPreview.headers,
rows: batchRows,
}),
});

const data = await response.json();

if (!response.ok) {
throw new Error(data.error || "Erreur pendant l’analyse du CSV.");
}

const batchResults: EnrichedLead[] = data.results.map(
(item: any, index: number) => ({
originalRow: batchRows[index] ?? [],
leadScore: Number(item.lead_score) || 0,
priority: item.priority || "MAYBE",
fitReason: item.fit_reason || "",
whyNow: item.why_now || "",
probableBusinessPains: item.probable_business_pains || "",
detectedOpportunities: item.detected_opportunities || "",
bestOutreachChannel: item.best_outreach_channel || "",
channelReason: item.channel_reason || "",
emailIdea: item.email_idea || "",
linkedinIdea: item.linkedin_idea || "",
callOpener: item.call_opener || "",
nextBestAction: item.next_best_action || "",
effortLevel: item.effort_level || "",
confidenceLevel: item.confidence_level || "",
probableObjection: item.probable_objection || "",
objectionHandling: item.objection_handling || "",
opportunityLevel: item.opportunity_level || "",
dealPotential: item.deal_potential || "",
painClarity: item.pain_clarity || "",
urgencyLevel: item.urgency_level || "",
salesReadiness: item.sales_readiness || "",
discoveryFocus: item.discovery_focus || "",
questionsToAsk: Array.isArray(item.questions_to_ask)
? item.questions_to_ask
: [],
valueHypothesis: item.value_hypothesis || "",
demoAngle: item.demo_angle || "",
handoffNote: item.handoff_note || "",
})
);

allResults.push(...batchResults);

setAnalysisProgress({
current: allResults.length,
total: rowsToAnalyze.length,
});

setEnrichedLeads([...allResults]);
}

saveAnalysis({
headers: csvPreview.headers,
leads: allResults,
fileName: csvFile?.name || "revora_leads.csv",
updatedAt: new Date().toLocaleString("fr-FR"),
});

if (!sessionIsUnlimited) {
const newUsed = usedThisMonth + allResults.length;
setUsedThisMonth(newUsed);
saveMonthlyUsage(sessionEmail, newUsed);
}

setMessage(
`Analyse CSV terminée ✅ ${allResults.length} lead(s) enrichi(s).`
);
} catch (error: any) {
console.error(error);
setMessage(error.message || "Impossible d’analyser le CSV.");
} finally {
setIsAnalyzing(false);
setAnalysisProgress({
current: 0,
total: 0,
});
}
}

function buildEnrichedCsv() {
if (csvPreview.headers.length === 0 || enrichedLeads.length === 0) {
return "";
}

const cleanForCsv = (value: string | number | string[] | null | undefined) => {
const normalized = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
return normalized.replace(/\r?\n|\r/g, " | ").replace(/\s+/g, " ").trim();
};

const enrichedHeaders = [
...csvPreview.headers,
"lead_score",
"priority",
"fit_reason",
"why_now",
"probable_business_pains",
"detected_opportunities",
"best_outreach_channel",
"channel_reason",
"email_idea",
"linkedin_idea",
"call_opener",
"next_best_action",
"effort_level",
"confidence_level",
"probable_objection",
"objection_handling",
"opportunity_level",
"deal_potential",
"pain_clarity",
"urgency_level",
"sales_readiness",
"discovery_focus",
"questions_to_ask",
"value_hypothesis",
"demo_angle",
"handoff_note",
];

const enrichedRows = enrichedLeads.map((lead) => [
...csvPreview.headers.map((_, index) =>
cleanForCsv(lead.originalRow[index] ?? "")
),
cleanForCsv(lead.leadScore),
cleanForCsv(lead.priority),
cleanForCsv(lead.fitReason),
cleanForCsv(lead.whyNow),
cleanForCsv(lead.probableBusinessPains),
cleanForCsv(lead.detectedOpportunities),
cleanForCsv(lead.bestOutreachChannel),
cleanForCsv(lead.channelReason),
cleanForCsv(lead.emailIdea),
cleanForCsv(lead.linkedinIdea),
cleanForCsv(lead.callOpener),
cleanForCsv(lead.nextBestAction),
cleanForCsv(lead.effortLevel),
cleanForCsv(lead.confidenceLevel),
cleanForCsv(lead.probableObjection),
cleanForCsv(lead.objectionHandling),
cleanForCsv(lead.opportunityLevel),
cleanForCsv(lead.dealPotential),
cleanForCsv(lead.painClarity),
cleanForCsv(lead.urgencyLevel),
cleanForCsv(lead.salesReadiness),
cleanForCsv(lead.discoveryFocus),
cleanForCsv(lead.questionsToAsk),
cleanForCsv(lead.valueHypothesis),
cleanForCsv(lead.demoAngle),
cleanForCsv(lead.handoffNote),
]);

return Papa.unparse(
{
fields: enrichedHeaders,
data: enrichedRows,
},
{
delimiter: ";",
newline: "\r\n",
quotes: true,
}
);
}

function downloadEnrichedCsv() {
const enrichedCsv = buildEnrichedCsv();

if (!enrichedCsv) {
setMessage("Aucun CSV enrichi à télécharger.");
return;
}

const blob = new Blob(["\uFEFF" + enrichedCsv], {
type: "text/csv;charset=utf-8;",
});

const url = URL.createObjectURL(blob);
const link = document.createElement("a");
const originalFileName =
csvFile?.name?.replace(".csv", "") || "revora_leads";

const finalFileName = `${originalFileName}_analyse_pro.csv`;

link.href = url;
link.download = finalFileName;

document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);

saveExport({
fileName: finalFileName,
format: "CSV",
status: "READY",
createdAt: new Date().toLocaleString("fr-FR"),
leadCount: enrichedLeads.length,
type: "Analyse CSV pro",
});
}

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

<div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-8 px-6 py-8">
<section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
<div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/30">
<div className="absolute inset-0 bg-slate-950/75" />
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_30%),radial-gradient(circle_at_left,rgba(34,211,238,0.15),transparent_20%)]" />

<div className="relative p-8 md:p-10">
<p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Sales intelligence
</p>

<h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
Analyse CSV
<span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
{" "}
version hybride
</span>
</h1>

<p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
Priorise tes leads, prépare l’outbound et facilite le handoff
vers un AE ou un ingénieur commercial.
</p>

<div className="mt-8 grid gap-4 sm:grid-cols-3">
<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">
Pipeline
</p>
<p className="mt-2 text-2xl font-semibold text-white">
{rowCount}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">
Score moyen
</p>
<p className="mt-2 text-2xl font-semibold text-white">
{averageScore}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">
Plan actif
</p>
<p className="mt-2 text-lg font-semibold text-white">
{sessionPlan.toUpperCase()}
</p>
</div>
</div>
</div>
</div>

<div className="rounded-[32px] border border-white/10 bg-white p-7 text-slate-900 shadow-2xl shadow-slate-950/30">
<div className="mb-6">
<p className="text-sm font-medium text-blue-600">Analyse CSV</p>
<h2 className="mt-1 text-2xl font-semibold">
Lance l’analyse hybride
</h2>
</div>

<div className="grid gap-5">
<div className="grid gap-2">
<label htmlFor="companyName" className="text-sm font-semibold">
Nom entreprise
</label>
<input
id="companyName"
name="companyName"
type="text"
value={formData.companyName}
onChange={(event) =>
setFormData((prev) => ({
...prev,
companyName: event.target.value,
}))
}
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
/>
</div>

<div className="grid gap-2">
<label
htmlFor="companyDescription"
className="text-sm font-semibold"
>
Description entreprise
</label>
<textarea
id="companyDescription"
name="companyDescription"
value={formData.companyDescription}
onChange={(event) =>
setFormData((prev) => ({
...prev,
companyDescription: event.target.value,
}))
}
rows={3}
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
/>
</div>

<div className="grid gap-2">
<label
htmlFor="offerDescription"
className="text-sm font-semibold"
>
Description offre
</label>
<textarea
id="offerDescription"
name="offerDescription"
value={formData.offerDescription}
onChange={(event) =>
setFormData((prev) => ({
...prev,
offerDescription: event.target.value,
}))
}
rows={3}
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
/>
</div>

<div className="grid gap-2">
<label htmlFor="target" className="text-sm font-semibold">
Cible
</label>
<input
id="target"
name="target"
type="text"
value={formData.target}
onChange={(event) =>
setFormData((prev) => ({
...prev,
target: event.target.value,
}))
}
className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
/>
</div>

<div className="grid gap-2">
<label htmlFor="csvFile" className="text-sm font-semibold">
Upload CSV
</label>
<input
id="csvFile"
name="csvFile"
type="file"
accept=".csv"
onChange={handleFileChange}
className="rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm"
/>
{csvFile && (
<p className="text-sm text-slate-500">
Fichier sélectionné : {csvFile.name}
</p>
)}
{isReadingCsv && (
<p className="text-sm text-slate-500">
Lecture du CSV en cours...
</p>
)}
</div>

<div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
<p>Export : {exportFormat}</p>
<p className="mt-2 font-medium">
Plan {sessionPlan.toUpperCase()} ·{" "}
{sessionIsUnlimited
? "quota mensuel illimité"
: `${usedThisMonth}/${sessionMonthlyLimit ?? 0} leads utilisés ce mois`}
</p>
{!sessionIsUnlimited && (
<p className="mt-1">
Restants ce mois : {remainingThisMonth ?? 0} leads
</p>
)}
</div>

<div className="grid gap-3 pt-2 md:grid-cols-[1fr_auto]">
<button
type="button"
onClick={handleAdvancedAnalysis}
disabled={isAnalyzing}
className="rounded-2xl bg-slate-950 px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
>
{isAnalyzing ? "Analyse en cours..." : "Analyser mes leads"}
</button>

{enrichedLeads.length > 0 && (
<button
type="button"
onClick={downloadEnrichedCsv}
className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
>
Télécharger
</button>
)}
</div>

{isAnalyzing && analysisProgress.total > 0 && (
<div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
Analyse en cours... {analysisProgress.current} / {analysisProgress.total} leads traités
</div>
)}

{message && (
<p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
{message}
</p>
)}
</div>
</div>
</section>

{enrichedLeads.length > 0 && (
<section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
<div className="mb-6 flex flex-col gap-5">
<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
<div>
<p className="text-sm text-cyan-300">Résultats enrichis</p>
<h2 className="mt-1 text-2xl font-semibold text-white">
Analyse hybride REVORA
</h2>
</div>

<div className="grid grid-cols-3 gap-3 md:w-[320px]">
<div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-center">
<p className="text-xs uppercase tracking-wider text-emerald-300">
GO
</p>
<p className="mt-2 text-xl font-semibold text-white">
{stats.go}
</p>
</div>

<div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-center">
<p className="text-xs uppercase tracking-wider text-amber-300">
MAYBE
</p>
<p className="mt-2 text-xl font-semibold text-white">
{stats.maybe}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
<p className="text-xs uppercase tracking-wider text-white/55">
SKIP
</p>
<p className="mt-2 text-xl font-semibold text-white">
{stats.skip}
</p>
</div>
</div>
</div>

<div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
<input
type="text"
placeholder="Rechercher un lead, une entreprise, un angle..."
value={searchTerm}
onChange={(event) => setSearchTerm(event.target.value)}
className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35"
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
</div>

<div className="mb-4 text-sm text-white/55">
{filteredLeads.length} résultat(s) affiché(s)
</div>

<div className="grid gap-4">
{filteredLeads.map((lead, index) => (
<div
key={index}
className="rounded-2xl border border-white/10 bg-white/5 p-5"
>
<div className="mb-4 flex items-start justify-between gap-4">
<div>
<p className="text-lg font-semibold text-white">
{lead.originalRow[0] || "Lead"}
</p>
<p className="mt-2 text-sm text-white/60">
{lead.fitReason}
</p>
</div>

<div className="flex items-center gap-3">
<span className="text-xl font-semibold text-white">
{lead.leadScore}
</span>
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
lead.priority
)}`}
>
{lead.priority}
</span>
</div>
</div>

<div className="grid gap-4 md:grid-cols-2">
<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Why now
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.whyNow}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Canal recommandé
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.bestOutreachChannel}
</p>
<p className="mt-2 text-sm leading-7 text-white/60">
{lead.channelReason}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Pains
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.probableBusinessPains}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Opportunities
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.detectedOpportunities}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Email idea
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.emailIdea}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
LinkedIn idea
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.linkedinIdea}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Call opener
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.callOpener}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Next best action
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.nextBestAction}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Objection probable
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.probableObjection}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Objection handling
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.objectionHandling}
</p>
</div>
</div>

<div className="mt-4 grid gap-4 md:grid-cols-2">
<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Opportunity level
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.opportunityLevel}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Deal potential
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.dealPotential}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Pain clarity
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.painClarity}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Urgency level
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.urgencyLevel}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Sales readiness
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.salesReadiness}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Discovery focus
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.discoveryFocus}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Questions to ask
</p>
<ul className="mt-2 grid gap-2 text-sm leading-7 text-white/80">
{lead.questionsToAsk.map((question, qIndex) => (
<li key={`${question}-${qIndex}`}>• {question}</li>
))}
</ul>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Value hypothesis
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.valueHypothesis}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Demo angle
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.demoAngle}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Handoff note
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.handoffNote}
</p>
</div>
</div>

<div className="mt-4 flex flex-wrap gap-2">
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
Effort : {lead.effortLevel}
</span>
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
Confiance : {lead.confidenceLevel}
</span>
</div>
</div>
))}
</div>
</section>
)}
</div>
</main>
</ProtectedPage>
);
}
