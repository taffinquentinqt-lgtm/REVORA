"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
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
priority: "GO" | "MAYBE" | "SKIP";

confidenceLevel: string;
analysisDepth: string;

fitIcpScore: number;
roleRelevanceScore: number;
dataQualityScore: number;
needRelevanceScore: number;
actionabilityScore: number;

fitReason: string;
whyNow: string;
probableBusinessPains: string[];
detectedOpportunities: string[];

bestOutreachChannel: string;
channelReason: string;
emailIdea: string;
linkedinIdea: string;
callOpener: string;
nextBestAction: string;

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
const [exportFormat, setExportFormat] = useState("XLSX");

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
setExportFormat(settings.exportFormat || "XLSX");

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

return enrichedLeads
.filter((lead) => {
const matchesPriority =
activeFilter === "ALL" ? true : lead.priority === activeFilter;

if (!matchesPriority) return false;
if (!normalizedSearch) return true;

const haystack = normalizeForSearch(
[
...lead.originalRow,
lead.fitReason,
lead.whyNow,
lead.probableBusinessPains.join(" "),
lead.detectedOpportunities.join(" "),
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
lead.handoffNote,
lead.confidenceLevel,
lead.analysisDepth,
].join(" ")
);

return haystack.includes(normalizedSearch);
})
.sort((a, b) => b.leadScore - a.leadScore);
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

if (parsedCsv.headers.length === 0) {
setCsvFile(null);
setCsvPreview({ headers: [], rows: [] });
setEnrichedLeads([]);
setMessage("Le fichier CSV est vide ou illisible.");
return;
}

setCsvFile(file);
setCsvPreview(parsedCsv);
setEnrichedLeads([]);
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

const response = await fetch("/api/analyze-csv", {
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

const rawText = await response.text();

let data: any;
try {
data = JSON.parse(rawText);
} catch {
throw new Error(
`La route /api/analyze-csv ne renvoie pas du JSON. Réponse reçue : ${rawText.slice(0, 300)}`
);
}

if (!response.ok) {
console.error("analyze-csv response error:", data);
throw new Error(
data.error ||
data.raw ||
JSON.stringify(data) ||
"Erreur pendant l’analyse du CSV."
);
}

const batchResults: EnrichedLead[] = data.results.map(
(item: any, index: number) => ({
originalRow: batchRows[index] ?? [],
leadScore: Number(item.lead_score) || 0,
priority: item.priority || "MAYBE",

confidenceLevel: item.confidence_level || "medium",
analysisDepth: item.analysis_depth || "basic",

fitIcpScore: Number(item.fit_icp_score) || 0,
roleRelevanceScore: Number(item.role_relevance_score) || 0,
dataQualityScore: Number(item.data_quality_score) || 0,
needRelevanceScore: Number(item.need_relevance_score) || 0,
actionabilityScore: Number(item.actionability_score) || 0,

fitReason: item.fit_reason || "",
whyNow: item.why_now || "",
probableBusinessPains: Array.isArray(item.probable_business_pains)
? item.probable_business_pains
: [],
detectedOpportunities: Array.isArray(item.detected_opportunities)
? item.detected_opportunities
: [],

bestOutreachChannel: item.best_outreach_channel || "",
channelReason: item.channel_reason || "",
emailIdea: item.email_idea || "",
linkedinIdea: item.linkedin_idea || "",
callOpener: item.call_opener || "",
nextBestAction: item.next_best_action || "",

probableObjection: item.probable_objection || "",
objectionHandling: item.objection_handling || "",

opportunityLevel: item.opportunity_level || "medium",
dealPotential: item.deal_potential || "medium",
painClarity: item.pain_clarity || "medium",
urgencyLevel: item.urgency_level || "medium",
salesReadiness: item.sales_readiness || "worth_testing",
discoveryFocus: item.discovery_focus || "",
questionsToAsk: Array.isArray(item.questions_to_ask)
? item.questions_to_ask
: [],
valueHypothesis: item.value_hypothesis || "",
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
console.error("dashboard analyze error:", error);
setMessage(error?.message || "Impossible d’analyser le CSV.");
} finally {
setIsAnalyzing(false);
setAnalysisProgress({
current: 0,
total: 0,
});
}
}

async function downloadEnrichedCsv() {
if (enrichedLeads.length === 0 || csvPreview.headers.length === 0) {
setMessage("Aucun lead enrichi à exporter.");
return;
}

try {
setMessage("Préparation du fichier Excel...");

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet("REVORA Analyse");

const headers = [
...csvPreview.headers,
"lead_score",
"priority",
"confidence_level",
"analysis_depth",
"fit_icp_score",
"role_relevance_score",
"data_quality_score",
"need_relevance_score",
"actionability_score",
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
"handoff_note",
];

const clean = (value: string | number | string[] | null | undefined) => {
if (Array.isArray(value)) return value.join(" | ");
return String(value ?? "");
};

worksheet.addRow(headers);

enrichedLeads.forEach((lead) => {
worksheet.addRow([
...csvPreview.headers.map((_, index) => clean(lead.originalRow[index] ?? "")),
clean(lead.leadScore),
clean(lead.priority),
clean(lead.confidenceLevel),
clean(lead.analysisDepth),
clean(lead.fitIcpScore),
clean(lead.roleRelevanceScore),
clean(lead.dataQualityScore),
clean(lead.needRelevanceScore),
clean(lead.actionabilityScore),
clean(lead.fitReason),
clean(lead.whyNow),
clean(lead.probableBusinessPains),
clean(lead.detectedOpportunities),
clean(lead.bestOutreachChannel),
clean(lead.channelReason),
clean(lead.emailIdea),
clean(lead.linkedinIdea),
clean(lead.callOpener),
clean(lead.nextBestAction),
clean(lead.probableObjection),
clean(lead.objectionHandling),
clean(lead.opportunityLevel),
clean(lead.dealPotential),
clean(lead.painClarity),
clean(lead.urgencyLevel),
clean(lead.salesReadiness),
clean(lead.discoveryFocus),
clean(lead.questionsToAsk),
clean(lead.valueHypothesis),
clean(lead.handoffNote),
]);
});

const headerRow = worksheet.getRow(1);
headerRow.eachCell((cell) => {
cell.font = {
bold: true,
color: { argb: "FFFFFFFF" },
};
cell.fill = {
type: "pattern",
pattern: "solid",
fgColor: { argb: "FF0F172A" },
};
cell.alignment = {
vertical: "middle",
horizontal: "center",
wrapText: true,
};
cell.border = {
top: { style: "thin", color: { argb: "FF334155" } },
left: { style: "thin", color: { argb: "FF334155" } },
bottom: { style: "thin", color: { argb: "FF334155" } },
right: { style: "thin", color: { argb: "FF334155" } },
};
});
headerRow.height = 24;

worksheet.views = [{ state: "frozen", ySplit: 1 }];

worksheet.autoFilter = {
from: { row: 1, column: 1 },
to: { row: 1, column: headers.length },
};

const priorityColumnIndex = headers.indexOf("priority") + 1;
const scoreColumnIndex = headers.indexOf("lead_score") + 1;

for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
const row = worksheet.getRow(rowNumber);
const priority = String(row.getCell(priorityColumnIndex).value ?? "");

let fillColor = "FFFFFFFF";
let textColor = "FF0F172A";

if (priority === "GO") {
fillColor = "FFE8F5E9";
textColor = "FF166534";
} else if (priority === "MAYBE") {
fillColor = "FFFFF7E6";
textColor = "FF92400E";
} else if (priority === "SKIP") {
fillColor = "FFF3F4F6";
textColor = "FF374151";
}

row.eachCell((cell) => {
cell.fill = {
type: "pattern",
pattern: "solid",
fgColor: { argb: fillColor },
};
cell.font = {
color: { argb: textColor },
};
cell.alignment = {
vertical: "top",
wrapText: true,
};
cell.border = {
top: { style: "thin", color: { argb: "FFE5E7EB" } },
left: { style: "thin", color: { argb: "FFE5E7EB" } },
bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
right: { style: "thin", color: { argb: "FFE5E7EB" } },
};
});

const scoreCell = row.getCell(scoreColumnIndex);
scoreCell.font = {
bold: true,
color: { argb: textColor },
};
}

worksheet.columns = headers.map((header) => {
if (header === "lead_score") return { width: 12 };
if (header === "priority") return { width: 12 };
if (header === "confidence_level") return { width: 18 };
if (header === "analysis_depth") return { width: 16 };
if (header.includes("score")) return { width: 14 };
if (
[
"fit_reason",
"why_now",
"channel_reason",
"email_idea",
"linkedin_idea",
"call_opener",
"probable_objection",
"objection_handling",
"discovery_focus",
"value_hypothesis",
"handoff_note",
].includes(header)
) {
return { width: 28 };
}
if (
[
"probable_business_pains",
"detected_opportunities",
"questions_to_ask",
].includes(header)
) {
return { width: 34 };
}
return { width: Math.max(14, Math.min(24, header.length + 4)) };
});

const buffer = await workbook.xlsx.writeBuffer();
const blob = new Blob([buffer], {
type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

const url = URL.createObjectURL(blob);
const link = document.createElement("a");
const originalFileName =
csvFile?.name?.replace(".csv", "") || "revora_leads";
const finalFileName = `${originalFileName}_analyse_pro.xlsx`;

link.href = url;
link.download = finalFileName;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);

saveExport({
fileName: finalFileName,
format: "XLSX",
status: "READY",
createdAt: new Date().toLocaleString("fr-FR"),
leadCount: enrichedLeads.length,
type: "Analyse Excel colorée",
});

setMessage("Export Excel généré avec succès ✅");
} catch (error) {
console.error("export excel error:", error);
setMessage("Impossible de générer le fichier Excel.");
}
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
version forte
</span>
</h1>

<p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
Utilise ton profil d’analyse enrichi pour scorer, prioriser et
préparer les meilleures actions commerciales.
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
Lance l’analyse forte
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
Télécharger Excel
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
Analyse forte REVORA
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

<div className="mt-3 flex flex-wrap gap-2">
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
Confiance : {lead.confidenceLevel}
</span>
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
Analyse : {lead.analysisDepth}
</span>
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
Opportunity : {lead.opportunityLevel}
</span>
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
Readiness : {lead.salesReadiness}
</span>
</div>
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

<div className="mt-4 grid gap-4 md:grid-cols-2">
<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Scores détaillés
</p>
<ul className="mt-2 grid gap-2 text-sm leading-7 text-white/80">
<li>Fit ICP : {lead.fitIcpScore}/25</li>
<li>Rôle : {lead.roleRelevanceScore}/20</li>
<li>Qualité data : {lead.dataQualityScore}/15</li>
<li>Besoin : {lead.needRelevanceScore}/20</li>
<li>Actionnabilité : {lead.actionabilityScore}/20</li>
</ul>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Lecture senior
</p>
<ul className="mt-2 grid gap-2 text-sm leading-7 text-white/80">
<li>Deal potential : {lead.dealPotential}</li>
<li>Pain clarity : {lead.painClarity}</li>
<li>Urgency : {lead.urgencyLevel}</li>
</ul>
</div>
</div>

<div className="mt-4 grid gap-4 md:grid-cols-2">
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
{lead.probableBusinessPains.join(" • ")}
</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Opportunities
</p>
<p className="mt-2 text-sm leading-7 text-white/80">
{lead.detectedOpportunities.join(" • ")}
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

<div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
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
Opportunity : {lead.opportunityLevel}
</span>
<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
Readiness : {lead.salesReadiness}
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
