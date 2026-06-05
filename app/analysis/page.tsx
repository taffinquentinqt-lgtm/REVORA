"use client";

import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";
import {
getClientBrief,
getGeneratedProfile,
type RevoraClientBrief,
type RevoraGeneratedProfile,
} from "../lib/revora-profile";
import {
getAnalysis,
saveAnalysis,
saveExport,
type StoredLead,
} from "../lib/revora-storage";
import { getSession, type RevoraPlan } from "../lib/revora-auth";

type CsvPreview = {
headers: string[];
rows: string[][];
};

type Priority = "GO" | "MAYBE" | "SKIP";
type ActiveFilter = "ALL" | Priority;

type AnalysisResult = StoredLead;

type ApiLeadResult = {
lead_score?: number;
priority?: Priority;
confidence_level?: string;
analysis_depth?: string;
fit_icp_score?: number;
role_relevance_score?: number;
data_quality_score?: number;
need_relevance_score?: number;
actionability_score?: number;
fit_reason?: string;
why_now?: string;
probable_business_pains?: string[];
detected_opportunities?: string[];
best_outreach_channel?: string;
channel_reason?: string;
email_idea?: string;
linkedin_idea?: string;
call_opener?: string;
next_best_action?: string;
probable_objection?: string;
objection_handling?: string;
opportunity_level?: string;
deal_potential?: string;
pain_clarity?: string;
urgency_level?: string;
sales_readiness?: string;
discovery_focus?: string;
questions_to_ask?: string[];
value_hypothesis?: string;
handoff_note?: string;
};

const EMPTY_CSV: CsvPreview = {
headers: [],
rows: [],
};

const enrichedHeaders = [
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

function normalizeCell(value: unknown) {
if (value === null || value === undefined) return "";
return String(value).trim();
}

function normalizeForSearch(value: string) {
return value
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function parseCsvText(text: string): CsvPreview {
const result = Papa.parse<string[]>(text, {
delimiter: "",
skipEmptyLines: true,
});

const data = result.data
.map((row) => row.map((cell) => normalizeCell(cell)))
.filter((row) => row.some((cell) => cell !== ""));

if (data.length === 0) {
return EMPTY_CSV;
}

return {
headers: data[0],
rows: data.slice(1),
};
}

function normalizePriority(value: unknown): Priority {
if (value === "GO" || value === "MAYBE" || value === "SKIP") {
return value;
}

return "MAYBE";
}

function toArray(value: unknown) {
return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function mapApiResult(item: ApiLeadResult, originalRow: string[]): AnalysisResult {
return {
originalRow,
leadScore: Number(item.lead_score) || 0,
priority: normalizePriority(item.priority),
confidenceLevel: item.confidence_level || "medium",
analysisDepth: item.analysis_depth || "basic",
fitIcpScore: Number(item.fit_icp_score) || 0,
roleRelevanceScore: Number(item.role_relevance_score) || 0,
dataQualityScore: Number(item.data_quality_score) || 0,
needRelevanceScore: Number(item.need_relevance_score) || 0,
actionabilityScore: Number(item.actionability_score) || 0,
fitReason: item.fit_reason || "",
whyNow: item.why_now || "",
probableBusinessPains: toArray(item.probable_business_pains),
detectedOpportunities: toArray(item.detected_opportunities),
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
questionsToAsk: toArray(item.questions_to_ask),
valueHypothesis: item.value_hypothesis || "",
handoffNote: item.handoff_note || "",
};
}

function csvEscape(value: string | number | string[] | undefined) {
const raw = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
return `"${raw.replace(/"/g, '""')}"`;
}

function getPriorityClasses(priority: Priority) {
if (priority === "GO") {
return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
}

if (priority === "MAYBE") {
return "border-amber-400/30 bg-amber-500/15 text-amber-200";
}

return "border-white/10 bg-white/10 text-slate-200";
}

function getPriorityGlow(priority: Priority) {
if (priority === "GO") return "from-emerald-400/25";
if (priority === "MAYBE") return "from-amber-400/25";
return "from-slate-400/15";
}

function getCurrentMonthKey() {
const now = new Date();
return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthlyUsage(email: string) {
if (typeof window === "undefined") return { monthKey: getCurrentMonthKey(), usedLeads: 0 };
const raw = localStorage.getItem(`revora_monthly_usage_${email.toLowerCase()}`);
const currentMonthKey = getCurrentMonthKey();
if (!raw) return { monthKey: currentMonthKey, usedLeads: 0 };
try {
const parsed = JSON.parse(raw) as { monthKey?: string; usedLeads?: number };
if (parsed.monthKey !== currentMonthKey) return { monthKey: currentMonthKey, usedLeads: 0 };
return { monthKey: currentMonthKey, usedLeads: Number(parsed.usedLeads) || 0 };
} catch {
return { monthKey: currentMonthKey, usedLeads: 0 };
}
}

function saveMonthlyUsage(email: string, usedLeads: number) {
if (typeof window === "undefined") return;
localStorage.setItem(
`revora_monthly_usage_${email.toLowerCase()}`,
JSON.stringify({ monthKey: getCurrentMonthKey(), usedLeads })
);
}

export default function AnalysisPage() {
const [csvFile, setCsvFile] = useState<File | null>(null);
const [csvPreview, setCsvPreview] = useState<CsvPreview>(EMPTY_CSV);
const [brief, setBrief] = useState<RevoraClientBrief | null>(null);
const [generatedProfile, setGeneratedProfile] =
useState<RevoraGeneratedProfile | null>(null);
const [results, setResults] = useState<AnalysisResult[]>([]);
const [lastFileName, setLastFileName] = useState("");
const [lastUpdatedAt, setLastUpdatedAt] = useState("");
const [message, setMessage] = useState("");
const [isReadingCsv, setIsReadingCsv] = useState(false);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
const [searchTerm, setSearchTerm] = useState("");
const [copiedKey, setCopiedKey] = useState<string | null>(null);
const [isDragging, setIsDragging] = useState(false);
const [progress, setProgress] = useState({
current: 0,
total: 0,
});

const [sessionEmail, setSessionEmail] = useState("");
const [sessionPlan, setSessionPlan] = useState<RevoraPlan>("demo");
const [sessionMonthlyLimit, setSessionMonthlyLimit] = useState<number | null>(200);
const [sessionIsUnlimited, setSessionIsUnlimited] = useState(false);
const [usedThisMonth, setUsedThisMonth] = useState(0);

useEffect(() => {
const storedBrief = getClientBrief();
const storedProfile = getGeneratedProfile();
const storedAnalysis = getAnalysis();

const session = getSession();
if (session) {
setSessionEmail(session.email);
setSessionPlan(session.plan);
setSessionMonthlyLimit(session.monthlyLimit);
setSessionIsUnlimited(session.isUnlimited);
const usage = getMonthlyUsage(session.email);
setUsedThisMonth(usage.usedLeads);
}

queueMicrotask(() => {
setBrief(storedBrief);

if (storedProfile.productSummary) {
setGeneratedProfile(storedProfile);
}

if (storedAnalysis) {
setCsvPreview({
headers: storedAnalysis.headers,
rows: storedAnalysis.leads.map((lead) => lead.originalRow),
});
setResults(storedAnalysis.leads);
setLastFileName(storedAnalysis.fileName);
setLastUpdatedAt(storedAnalysis.updatedAt);
}
});
}, []);

const rowCount = csvPreview.rows.length;
const hasProfile = Boolean(generatedProfile?.productSummary);

const stats = useMemo(() => {
const go = results.filter((lead) => lead.priority === "GO").length;
const maybe = results.filter((lead) => lead.priority === "MAYBE").length;
const skip = results.filter((lead) => lead.priority === "SKIP").length;

return { go, maybe, skip };
}, [results]);

const averageScore = useMemo(() => {
if (results.length === 0) return 0;
const total = results.reduce((sum, lead) => sum + lead.leadScore, 0);
return Math.round(total / results.length);
}, [results]);

const filteredResults = useMemo(() => {
const normalizedSearch = normalizeForSearch(searchTerm);

return results
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
lead.bestOutreachChannel,
lead.channelReason,
lead.nextBestAction,
lead.probableBusinessPains.join(" "),
lead.detectedOpportunities.join(" "),
lead.emailIdea,
lead.linkedinIdea,
lead.callOpener,
lead.discoveryFocus,
lead.valueHypothesis,
lead.handoffNote,
].join(" ")
);

return haystack.includes(normalizedSearch);
})
.sort((a, b) => b.leadScore - a.leadScore);
}, [activeFilter, results, searchTerm]);

async function processFile(file: File) {
if (!file.name.toLowerCase().endsWith(".csv")) {
setCsvFile(null);
setCsvPreview(EMPTY_CSV);
setResults([]);
setMessage("Merci d'ajouter un fichier CSV.");
return;
}

try {
setIsReadingCsv(true);
setMessage("");

const parsedCsv = parseCsvText(await file.text());

if (parsedCsv.headers.length === 0 || parsedCsv.rows.length === 0) {
setCsvFile(null);
setCsvPreview(EMPTY_CSV);
setResults([]);
setMessage("Le fichier CSV est vide ou ne contient aucune ligne à analyser.");
return;
}

setCsvFile(file);
setCsvPreview(parsedCsv);
setResults([]);
setLastFileName(file.name);
setLastUpdatedAt("");
setMessage(`${parsedCsv.rows.length} lead(s) prêts pour analyse.`);
} catch (error) {
console.error("analysis csv read error:", error);
setCsvFile(null);
setCsvPreview(EMPTY_CSV);
setResults([]);
setMessage("Impossible de lire ce fichier CSV.");
} finally {
setIsReadingCsv(false);
}
}

function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
const file = event.target.files?.[0];
if (file) processFile(file);
}

function handleDragOver(event: React.DragEvent<HTMLLabelElement>) {
event.preventDefault();
setIsDragging(true);
}

function handleDragLeave(event: React.DragEvent<HTMLLabelElement>) {
if (!event.currentTarget.contains(event.relatedTarget as Node)) {
setIsDragging(false);
}
}

function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
event.preventDefault();
setIsDragging(false);
const file = event.dataTransfer.files[0];
if (file) processFile(file);
}

async function handleAnalyze() {
if (!brief) {
setMessage("Brief introuvable. Configure d'abord ton profil dans Settings.");
return;
}

if (!generatedProfile) {
setMessage("Profil d'analyse manquant. Génère-le d'abord dans Settings.");
return;
}

if (csvPreview.headers.length === 0 || csvPreview.rows.length === 0) {
setMessage("Ajoute un CSV valide avant de lancer l'analyse.");
return;
}

if (!sessionIsUnlimited && sessionMonthlyLimit !== null) {
const remaining = Math.max(0, sessionMonthlyLimit - usedThisMonth);
if (remaining <= 0) {
setMessage(`Quota mensuel atteint pour le plan ${sessionPlan.toUpperCase()}.`);
return;
}
}

const allowedCount = sessionIsUnlimited
? csvPreview.rows.length
: Math.min(csvPreview.rows.length, Math.max(0, (sessionMonthlyLimit ?? 0) - usedThisMonth));

const rowsToAnalyze = csvPreview.rows.slice(0, allowedCount);
const batchSize = 5;
const totalBatches = Math.ceil(rowsToAnalyze.length / batchSize);
const maxConcurrentBatches = 3;

try {
setIsAnalyzing(true);
setMessage("");
setResults([]);
setProgress({
current: 0,
total: rowsToAnalyze.length,
});

const batchResultsByIndex: AnalysisResult[][] = [];
let nextBatchIndex = 0;

async function analyzeBatch(batchIndex: number): Promise<AnalysisResult[]> {
const start = batchIndex * batchSize;
const end = start + batchSize;
const batchRows = rowsToAnalyze.slice(start, end);

setMessage(`Analyse en cours... lot ${batchIndex + 1}/${totalBatches}`);

const response = await fetch("/api/analyze", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
brief,
generatedProfile,
headers: csvPreview.headers,
rows: batchRows,
}),
});

const rawText = await response.text();
let data: { results?: ApiLeadResult[]; error?: string; raw?: unknown } = {};

try {
data = rawText ? JSON.parse(rawText) : {};
} catch {
throw new Error(
`La route /api/analyze ne renvoie pas du JSON. Réponse reçue : ${rawText.slice(0, 240)}`
);
}

if (!response.ok) {
throw new Error(
data.error ||
(typeof data.raw === "string" ? data.raw : "") ||
"Erreur pendant l'analyse."
);
}

if (!Array.isArray(data.results)) {
throw new Error("Réponse d'analyse invalide: results est manquant.");
}

return data.results.map((item, index) =>
mapApiResult(item, batchRows[index] ?? [])
);
}

async function runWorker() {
while (nextBatchIndex < totalBatches) {
const batchIndex = nextBatchIndex++;
batchResultsByIndex[batchIndex] = await analyzeBatch(batchIndex);

const completed = batchResultsByIndex.flatMap((batch) => batch ?? []);
setResults([...completed]);
setProgress({
current: completed.length,
total: rowsToAnalyze.length,
});
}
}

await Promise.all(
Array.from({ length: Math.min(maxConcurrentBatches, totalBatches) }, () =>
runWorker()
)
);

const allResults = batchResultsByIndex.flatMap((batch) => batch ?? []);
const fileName = csvFile?.name || lastFileName || "revora_leads.csv";
const updatedAt = new Date().toLocaleString("fr-FR");

saveAnalysis({
headers: csvPreview.headers,
leads: allResults,
fileName,
updatedAt,
});

setLastFileName(fileName);
setLastUpdatedAt(updatedAt);

if (!sessionIsUnlimited && sessionEmail) {
const newUsed = usedThisMonth + allResults.length;
setUsedThisMonth(newUsed);
saveMonthlyUsage(sessionEmail, newUsed);
}

setMessage(`${allResults.length} lead(s) analysés avec succès.`);
} catch (error: unknown) {
console.error("analysis page analyze error:", error);
setMessage(
error instanceof Error ? error.message : "Impossible de terminer l'analyse."
);
} finally {
setIsAnalyzing(false);
setProgress({ current: 0, total: 0 });
}
}

async function handleCopy(key: string, text: string) {
try {
await navigator.clipboard.writeText(text);
setCopiedKey(key);
setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
} catch {}
}

function handleDownloadCsv() {
if (results.length === 0 || csvPreview.headers.length === 0) {
setMessage("Aucun résultat à exporter.");
return;
}

const headers = [...csvPreview.headers, ...enrichedHeaders];
const lines = [
headers.map(csvEscape).join(","),
...results.map((lead) =>
[
...csvPreview.headers.map((_, index) => lead.originalRow[index] ?? ""),
lead.leadScore,
lead.priority,
lead.confidenceLevel,
lead.analysisDepth,
lead.fitIcpScore,
lead.roleRelevanceScore,
lead.dataQualityScore,
lead.needRelevanceScore,
lead.actionabilityScore,
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
lead.questionsToAsk,
lead.valueHypothesis,
lead.handoffNote,
]
.map(csvEscape)
.join(",")
),
];

const blob = new Blob([lines.join("\n")], {
type: "text/csv;charset=utf-8",
});
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
const baseName = (lastFileName || csvFile?.name || "revora_leads").replace(
/\.csv$/i,
""
);
const fileName = `${baseName}_analyse_revora.csv`;

link.href = url;
link.download = fileName;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);

saveExport({
fileName,
format: "CSV",
status: "READY",
createdAt: new Date().toLocaleString("fr-FR"),
leadCount: results.length,
type: "Analyse CSV enrichie",
});

setMessage("Export CSV généré.");
}

async function handleDownloadExcel() {
if (results.length === 0 || csvPreview.headers.length === 0) {
setMessage("Aucun résultat à exporter.");
return;
}

try {
setMessage("Préparation du fichier Excel...");

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet("REVORA Analyse");

const headers = [...csvPreview.headers, ...enrichedHeaders];

const clean = (value: string | number | string[] | null | undefined) => {
if (Array.isArray(value)) return value.join(" | ");
return String(value ?? "");
};

worksheet.addRow(headers);

results.forEach((lead) => {
worksheet.addRow([
...csvPreview.headers.map((_, i) => clean(lead.originalRow[i] ?? "")),
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
cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
cell.border = {
top: { style: "thin", color: { argb: "FF334155" } },
left: { style: "thin", color: { argb: "FF334155" } },
bottom: { style: "thin", color: { argb: "FF334155" } },
right: { style: "thin", color: { argb: "FF334155" } },
};
});
headerRow.height = 24;

worksheet.views = [{ state: "frozen", ySplit: 1 }];
worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

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
cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
cell.font = { color: { argb: textColor } };
cell.alignment = { vertical: "top", wrapText: true };
cell.border = {
top: { style: "thin", color: { argb: "FFE5E7EB" } },
left: { style: "thin", color: { argb: "FFE5E7EB" } },
bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
right: { style: "thin", color: { argb: "FFE5E7EB" } },
};
});

worksheet.getRow(rowNumber).getCell(scoreColumnIndex).font = { bold: true, color: { argb: textColor } };
}

worksheet.columns = headers.map((header) => {
if (header === "lead_score") return { width: 12 };
if (header === "priority") return { width: 12 };
if (header === "confidence_level") return { width: 18 };
if (header === "analysis_depth") return { width: 16 };
if (header.includes("score")) return { width: 14 };
if (["fit_reason", "why_now", "channel_reason", "email_idea", "linkedin_idea", "call_opener", "probable_objection", "objection_handling", "discovery_focus", "value_hypothesis", "handoff_note"].includes(header)) return { width: 28 };
if (["probable_business_pains", "detected_opportunities", "questions_to_ask"].includes(header)) return { width: 34 };
return { width: Math.max(14, Math.min(24, header.length + 4)) };
});

const buffer = await workbook.xlsx.writeBuffer();
const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
const baseName = (lastFileName || csvFile?.name || "revora_leads").replace(/\.csv$/i, "");
const fileName = `${baseName}_analyse_revora.xlsx`;

link.href = url;
link.download = fileName;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);

saveExport({
fileName,
format: "XLSX",
status: "READY",
createdAt: new Date().toLocaleString("fr-FR"),
leadCount: results.length,
type: "Analyse Excel colorée",
});

setMessage("Export Excel généré ✅");
} catch (error) {
console.error("analysis excel export error:", error);
setMessage("Impossible de générer le fichier Excel.");
}
}

function getFilterButtonClasses(filter: ActiveFilter) {
const isActive = activeFilter === filter;

if (isActive) {
return "border-cyan-300/50 bg-cyan-300/15 text-cyan-100";
}

return "border-white/10 bg-white/5 text-white/65 hover:border-white/20 hover:bg-white/10";
}

return (
<ProtectedPage>
<main className="revora-app-bg relative min-h-screen overflow-hidden text-white">
<TopNav />

<div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-6 py-8">
<section className="revora-glass revora-reveal relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30 md:p-8">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.22),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.1),rgba(15,23,42,0.9))]" />
<div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
<div>
<p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/90">
REVORA Analysis
</p>
<h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
Score, priorise et prépare tes leads CSV.
</h1>
<p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
Importe un fichier, lance l&apos;analyse IA, puis récupère une lecture commerciale
directement exploitable: priorité, canal, angle d&apos;approche, objections et note
de passation.
</p>
</div>

<div className="grid gap-3 sm:grid-cols-3">
<div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">Pipeline</p>
<p className="mt-2 text-3xl font-semibold">{rowCount}</p>
</div>
<div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">Score moyen</p>
<p className="mt-2 text-3xl font-semibold">{averageScore}</p>
</div>
<div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">Profil</p>
<p className="mt-2 text-lg font-semibold">
{hasProfile ? "Prêt" : "À générer"}
</p>
</div>
</div>
</div>
</section>

<section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
<div className="revora-glass revora-reveal rounded-[32px] border border-white/10 bg-slate-900/90 p-6 text-white shadow-2xl shadow-slate-950/50 backdrop-blur-xl md:p-8">
<div className="flex flex-col gap-5">
<div>
<p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
Input
</p>
<h2 className="mt-2 text-2xl font-semibold text-white">Nouveau CSV</h2>
<p className="mt-2 text-sm leading-6 text-white/55">
Le fichier doit contenir une première ligne d&apos;en-têtes. REVORA analyse les
lignes par lots de 10 pour garder une réponse stable.
</p>
</div>

<label
htmlFor="csvFile"
onDragOver={handleDragOver}
onDragLeave={handleDragLeave}
onDrop={handleDrop}
className={`group grid cursor-pointer gap-3 rounded-3xl border border-dashed p-6 transition ${
isDragging
? "border-cyan-400/70 bg-cyan-500/15 scale-[1.01]"
: "border-white/15 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-500/10"
}`}
>
<span className="text-sm font-semibold text-white">
{isDragging ? "Lâche le fichier ici" : "Importer un fichier CSV"}
</span>
<span className="text-sm leading-6 text-white/50">
{csvFile?.name || lastFileName || "Glisse ou clique pour importer — CSV uniquement."}
</span>
<input
id="csvFile"
type="file"
accept=".csv,text/csv"
onChange={handleFileChange}
className="sr-only"
/>
</label>

<div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
<div className="flex items-center justify-between gap-4">
<span className="text-sm font-semibold text-white/80">Statut profil</span>
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${
hasProfile
? "bg-emerald-500/15 text-emerald-300"
: "bg-amber-500/15 text-amber-300"
}`}
>
{hasProfile ? "Profil d'analyse chargé" : "Profil à générer"}
</span>
</div>
<p className="text-sm leading-6 text-white/55">
{hasProfile
? generatedProfile?.valueProposition
: "Va dans Settings pour générer le profil d'analyse avant de lancer le scoring."}
</p>
</div>

<div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
<p className="font-medium">
Plan {sessionPlan.toUpperCase()} ·{" "}
{sessionIsUnlimited
? "quota illimité"
: `${usedThisMonth} / ${sessionMonthlyLimit ?? 0} leads ce mois`}
</p>
{!sessionIsUnlimited && sessionMonthlyLimit !== null && (
<p className="mt-1 text-white/45">
Restants : {Math.max(0, sessionMonthlyLimit - usedThisMonth)} leads
</p>
)}
</div>

{message && (
<div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-6 text-white/70">
{message}
</div>
)}

{isAnalyzing && progress.total > 0 && (
<div className="grid gap-2">
<div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-white/40">
<span>Progression</span>
<span>
{progress.current}/{progress.total}
</span>
</div>
<div className="h-3 overflow-hidden rounded-full bg-white/10">
<div
className="h-full rounded-full bg-cyan-500 transition-all"
style={{
width: `${Math.max(5, (progress.current / progress.total) * 100)}%`,
}}
/>
</div>
</div>
)}

{(!hasProfile || rowCount === 0) && !isAnalyzing && (
<p className="text-xs text-white/50">
{!hasProfile && rowCount === 0
? "Génère un profil dans Settings et ajoute un CSV."
: !hasProfile
? "Profil manquant — génère-le dans Settings."
: "Ajoute un fichier CSV pour lancer l'analyse."}
</p>
)}

<div className="flex flex-col gap-3 sm:flex-row">
<button
type="button"
onClick={handleAnalyze}
disabled={isReadingCsv || isAnalyzing || !hasProfile || rowCount === 0}
className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55"
>
{isAnalyzing ? "Analyse en cours..." : "Lancer l'analyse"}
</button>
<button
type="button"
onClick={handleDownloadCsv}
disabled={results.length === 0}
title={results.length === 0 ? "Lancez d'abord une analyse" : undefined}
className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
>
Exporter CSV
</button>
<button
type="button"
onClick={handleDownloadExcel}
disabled={results.length === 0}
title={results.length === 0 ? "Lancez d'abord une analyse" : undefined}
className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
>
Exporter Excel coloré
</button>
</div>
</div>
</div>

<div className="revora-glass revora-reveal revora-reveal-delay-1 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl md:p-8">
<div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
<div>
<p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
Aperçu
</p>
<h2 className="mt-2 text-2xl font-semibold">Colonnes détectées</h2>
<p className="mt-2 text-sm text-white/55">
{lastUpdatedAt
? `Dernière analyse: ${lastUpdatedAt}`
: "Aucune analyse sauvegardée sur ce fichier pour l'instant."}
</p>
</div>
<div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/75">
{csvPreview.headers.length} colonne(s)
</div>
</div>

{csvPreview.headers.length === 0 ? (
<div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm leading-7 text-white/60">
Ajoute un CSV pour afficher les colonnes et les premières lignes ici.
</div>
) : (
<div className="mt-6 grid gap-5">
<div className="flex flex-wrap gap-2">
{csvPreview.headers.map((header, index) => (
<span
key={`${header}-${index}`}
className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100"
>
{header || `Colonne ${index + 1}`}
</span>
))}
</div>

<div className="overflow-hidden rounded-3xl border border-white/10">
<div className="max-h-[300px] overflow-auto">
<table className="min-w-full divide-y divide-white/10 text-left text-sm">
<thead className="sticky top-0 bg-slate-950/95 text-xs uppercase tracking-wider text-white/45">
<tr>
{csvPreview.headers.slice(0, 6).map((header, index) => (
<th key={`${header}-${index}`} className="px-4 py-3 font-semibold">
{header || `Colonne ${index + 1}`}
</th>
))}
</tr>
</thead>
<tbody className="divide-y divide-white/10">
{csvPreview.rows.slice(0, 6).map((row, rowIndex) => (
<tr key={rowIndex} className="bg-white/[0.03]">
{csvPreview.headers.slice(0, 6).map((_, cellIndex) => (
<td key={cellIndex} className="max-w-[220px] truncate px-4 py-3 text-white/70">
{row[cellIndex] || "-"}
</td>
))}
</tr>
))}
</tbody>
</table>
</div>
</div>
</div>
)}
</div>
</section>

<section className="revora-glass revora-reveal rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl md:p-8">
<div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
<div>
<p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
Résultats
</p>
<h2 className="mt-2 text-2xl font-semibold">Lecture commerciale</h2>
</div>

<div className="grid gap-3 sm:grid-cols-3 xl:w-[420px]">
<div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-center">
<p className="text-xs uppercase tracking-wider text-emerald-300">GO</p>
<p className="mt-2 text-2xl font-semibold">{stats.go}</p>
</div>
<div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-center">
<p className="text-xs uppercase tracking-wider text-amber-300">MAYBE</p>
<p className="mt-2 text-2xl font-semibold">{stats.maybe}</p>
</div>
<div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
<p className="text-xs uppercase tracking-wider text-white/45">SKIP</p>
<p className="mt-2 text-2xl font-semibold">{stats.skip}</p>
</div>
</div>
</div>

<div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
<div className="relative">
<input
type="text"
value={searchTerm}
onChange={(event) => setSearchTerm(event.target.value)}
placeholder="Rechercher entreprise, rôle, angle, canal..."
className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 pr-10 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/40"
/>
{searchTerm && (
<button
type="button"
onClick={() => setSearchTerm("")}
className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70"
aria-label="Effacer la recherche"
>
✕
</button>
)}
</div>

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

{filteredResults.length === 0 ? (
<div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm leading-7 text-white/60">
Les résultats apparaîtront ici après analyse.
</div>
) : (
<div className="mt-6 grid gap-5">
{filteredResults.map((lead, index) => (
<article
key={`${lead.originalRow.join("-")}-${index}`}
className={`relative overflow-hidden rounded-3xl border bg-slate-950/60 p-5 ${
lead.priority === "GO" ? "border-emerald-400/25" : lead.priority === "MAYBE" ? "border-amber-400/20" : "border-white/8"
}`}
>
<div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${getPriorityGlow(lead.priority)} via-transparent to-transparent`} />
<div className={`absolute left-0 top-0 h-full w-[3px] rounded-l-3xl ${
lead.priority === "GO" ? "bg-emerald-400" : lead.priority === "MAYBE" ? "bg-amber-400" : "bg-slate-600"
}`} />
<div className="relative">
<div className="flex flex-col gap-4 pl-3 lg:flex-row lg:items-start lg:justify-between">
<div className="min-w-0 flex-1">
<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
<p className="text-lg font-semibold text-white">
{lead.originalRow[0] || `Lead ${index + 1}`}
</p>
{lead.originalRow[1] && <p className="text-sm text-white/45">{lead.originalRow[1]}</p>}
</div>
<p className="mt-2 max-w-4xl text-sm leading-7 text-white/60">
{lead.fitReason || "Aucune raison de fit fournie."}
</p>
</div>

<div className="flex shrink-0 items-center gap-3">
<div className="relative h-14 w-14">
<svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
<circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
<circle
cx="18" cy="18" r="14"
fill="none"
stroke={lead.leadScore >= 70 ? "#34d399" : lead.leadScore >= 40 ? "#fbbf24" : "#64748b"}
strokeWidth="3"
strokeDasharray={`${((lead.leadScore / 100) * 87.96).toFixed(2)} 87.96`}
strokeLinecap="round"
/>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="text-sm font-bold leading-none text-white">{lead.leadScore}</span>
<span className="text-[9px] text-white/40">/100</span>
</div>
</div>
<span className={`rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider ${getPriorityClasses(lead.priority)}`}>
{lead.priority}
</span>
</div>
</div>

<div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
<InfoCard title="Canal" value={lead.bestOutreachChannel || "-"} detail={lead.channelReason} />
<InfoCard title="Next action" value={lead.nextBestAction || "-"} detail={lead.whyNow} />
<InfoCard title="Readiness" value={lead.salesReadiness} detail={`Deal: ${lead.dealPotential} | Urgence: ${lead.urgencyLevel}`} />
<InfoCard title="Confiance" value={lead.confidenceLevel} detail={`Analyse: ${lead.analysisDepth}`} />
</div>

<div className="mt-4 grid gap-4 md:grid-cols-2">
<DetailBlock title="Angles et opportunités" items={lead.detectedOpportunities} fallback={lead.valueHypothesis} />
<DetailBlock title="Pains probables" items={lead.probableBusinessPains} fallback={lead.discoveryFocus} />
<DetailBlock title="Email idea" fallback={lead.emailIdea || "Aucun angle email fourni."} copyText={lead.emailIdea || undefined} onCopy={() => handleCopy(`${index}-email`, lead.emailIdea)} copied={copiedKey === `${index}-email`} />
<DetailBlock title="LinkedIn idea" fallback={lead.linkedinIdea || "Aucun angle LinkedIn fourni."} copyText={lead.linkedinIdea || undefined} onCopy={() => handleCopy(`${index}-linkedin`, lead.linkedinIdea)} copied={copiedKey === `${index}-linkedin`} />
<DetailBlock title="Call opener" fallback={lead.callOpener || "Aucun opener fourni."} copyText={lead.callOpener || undefined} onCopy={() => handleCopy(`${index}-call`, lead.callOpener)} copied={copiedKey === `${index}-call`} />
<DetailBlock title="Objection" fallback={`${lead.probableObjection || "-"} ${lead.objectionHandling ? `- ${lead.objectionHandling}` : ""}`} />
<DetailBlock title="Questions à poser" items={lead.questionsToAsk} fallback="Aucune question fournie." />
<DetailBlock title="Handoff note" fallback={lead.handoffNote || "Aucune note fournie."} />
</div>

<div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 md:grid-cols-5">
<ScorePill label="ICP" value={lead.fitIcpScore} max={25} />
<ScorePill label="Rôle" value={lead.roleRelevanceScore} max={20} />
<ScorePill label="Data" value={lead.dataQualityScore} max={15} />
<ScorePill label="Besoin" value={lead.needRelevanceScore} max={20} />
<ScorePill label="Action" value={lead.actionabilityScore} max={20} />
</div>
</div>
</article>
))}
</div>
)}
</section>
</div>
</main>
</ProtectedPage>
);
}

function InfoCard({
title,
value,
detail,
}: {
title: string;
value: string;
detail?: string;
}) {
return (
<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">{title}</p>
<p className="mt-2 text-sm font-semibold text-white">{value}</p>
{detail && <p className="mt-2 text-xs leading-6 text-white/55">{detail}</p>}
</div>
);
}

function DetailBlock({
title,
items,
fallback,
copyText,
onCopy,
copied,
}: {
title: string;
items?: string[];
fallback?: string;
copyText?: string;
onCopy?: () => void;
copied?: boolean;
}) {
return (
<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<div className="flex items-center justify-between gap-2">
<p className="text-xs uppercase tracking-wider text-cyan-300">{title}</p>
{copyText && onCopy && (
<button
type="button"
onClick={onCopy}
className="text-xs text-white/35 transition hover:text-white/65"
>
{copied ? "✓ Copié" : "Copier"}
</button>
)}
</div>
{items && items.length > 0 ? (
<ul className="mt-2 grid gap-2 text-sm leading-7 text-white/75">
{items.map((item, index) => (
<li key={`${item}-${index}`}>{item}</li>
))}
</ul>
) : (
<p className="mt-2 text-sm leading-7 text-white/75">{fallback || "-"}</p>
)}
</div>
);
}

function ScorePill({
label,
value,
max,
}: {
label: string;
value: number;
max: number;
}) {
return (
<div>
<p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
<p className="mt-1 font-semibold text-white">
{value}/{max}
</p>
</div>
);
}
