"use client";

import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
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

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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
const [expandedLeads, setExpandedLeads] = useState<Set<number>>(new Set());
const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
const [searchTerm, setSearchTerm] = useState("");
const [exportFormat, setExportFormat] = useState("XLSX");
const [copiedKey, setCopiedKey] = useState<string | null>(null);
const [isDragging, setIsDragging] = useState(false);

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
const [currentLeadPreview, setCurrentLeadPreview] = useState<{
index: number;
row: string[];
} | null>(null);

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

const analysisPercent = useMemo(() => {
if (analysisProgress.total <= 0) return 0;
return Math.min(
100,
Math.round((analysisProgress.current / analysisProgress.total) * 100)
);
}, [analysisProgress.current, analysisProgress.total]);

const currentLeadCells = useMemo(() => {
if (!currentLeadPreview) return [];

return csvPreview.headers.slice(0, 4).map((header, index) => ({
header,
value: currentLeadPreview.row[index] || "-",
}));
}, [csvPreview.headers, currentLeadPreview]);

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

async function processFile(file: File) {
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

const parsedCsv = parseCsvText(await file.text());

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
setMessage(`CSV chargé ✅ ${parsedCsv.rows.length} ligne(s) détectée(s).`);
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

async function handleCopy(key: string, text: string) {
try {
await navigator.clipboard.writeText(text);
setCopiedKey(key);
setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
} catch {}
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

const batchSize = 5;
const totalBatches = Math.ceil(rowsToAnalyze.length / batchSize);

try {
setIsAnalyzing(true);
setMessage("");
setEnrichedLeads([]);
setCurrentLeadPreview(null);
setAnalysisProgress({
current: 0,
total: rowsToAnalyze.length,
});

const brief = getClientBrief();
const maxConcurrentBatches = 3;
const batchResultsByIndex: EnrichedLead[][] = [];
let nextBatchIndex = 0;

async function analyzeBatch(batchIndex: number) {
const start = batchIndex * batchSize;
const end = start + batchSize;
const batchRows = rowsToAnalyze.slice(start, end);
setCurrentLeadPreview({
index: start + 1,
row: batchRows[0] ?? [],
});

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

return data.results.map(
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
}

function publishCompletedResults() {
const completedResults = batchResultsByIndex.flatMap((batch) => batch ?? []);

setAnalysisProgress({
current: completedResults.length,
total: rowsToAnalyze.length,
});

setEnrichedLeads(completedResults);

const nextIndex = completedResults.length + 1;
setCurrentLeadPreview(
nextIndex <= rowsToAnalyze.length
? {
index: nextIndex,
row: rowsToAnalyze[nextIndex - 1] ?? [],
}
: null
);
}

async function runBatchWorker() {
while (nextBatchIndex < totalBatches) {
const batchIndex = nextBatchIndex;
nextBatchIndex += 1;

batchResultsByIndex[batchIndex] = await analyzeBatch(batchIndex);
publishCompletedResults();
}
}

await Promise.all(
Array.from(
{ length: Math.min(maxConcurrentBatches, totalBatches) },
() => runBatchWorker()
)
);

const allResults = batchResultsByIndex.flatMap((batch) => batch ?? []);

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
setCurrentLeadPreview(null);
} catch (error: any) {
console.error("dashboard analyze error:", error);
setMessage(error?.message || "Impossible d’analyser le CSV.");
} finally {
setIsAnalyzing(false);
setCurrentLeadPreview(null);
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
<main className="revora-app-bg relative min-h-screen overflow-hidden text-white">
<TopNav />

<div className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-8 px-6 py-8">
<section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
<div className="revora-glass revora-reveal relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/30">
<div className="absolute inset-0 bg-slate-950/75" />
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_30%)]" />

<div className="relative p-8 md:p-10">
<p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
<span className="revora-pulse h-2 w-2 rounded-full bg-cyan-300" />
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
<div className="revora-lift rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">
Pipeline
</p>
<p className="mt-2 text-2xl font-semibold text-white">
{rowCount}
</p>
</div>

<div className="revora-lift rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">
Score moyen
</p>
<p className="mt-2 text-2xl font-semibold text-white">
{averageScore}
</p>
</div>

<div className="revora-lift rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
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

<div className="revora-glass revora-reveal revora-reveal-delay-1 rounded-[32px] border border-white/10 bg-slate-900/90 p-7 text-white shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
<div className="mb-6">
<p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/90">Analyse CSV</p>
<h2 className="mt-1 text-2xl font-semibold text-white">
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
className="revora-lift rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/50"
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
className="revora-lift rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/50"
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
className="revora-lift rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/50"
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
className="revora-lift rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/50"
/>
</div>

<div className="grid gap-2">
<label
htmlFor="csvFile"
onDragOver={handleDragOver}
onDragLeave={handleDragLeave}
onDrop={handleDrop}
className={`grid cursor-pointer gap-2 rounded-2xl border border-dashed p-4 transition ${
isDragging
? "border-cyan-400/70 bg-cyan-500/15"
: "border-white/15 bg-slate-800/30 hover:border-cyan-400/40 hover:bg-slate-800/50"
}`}
>
<span className="text-sm font-semibold text-white">
{isDragging ? "Lâche le fichier ici" : (csvFile?.name || "Upload CSV — glisse ou clique")}
</span>
{!csvFile && !isDragging && (
<span className="text-xs text-white/40">Format .csv uniquement</span>
)}
<input
id="csvFile"
name="csvFile"
type="file"
accept=".csv"
onChange={handleFileChange}
className="sr-only"
/>
</label>
{isReadingCsv && (
<p className="text-sm text-white/50">
Lecture du CSV en cours...
</p>
)}
</div>

<div className="revora-moving-band rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
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

{!generatedProfile && !isAnalyzing && (
<div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm">
<p className="font-semibold text-amber-200">Profil d'analyse manquant</p>
<p className="mt-1 text-amber-200/75">
Génère ton profil dans{" "}
<a href="/settings" className="underline transition hover:text-amber-100">
Settings
</a>{" "}
avant de lancer l'analyse.
</p>
</div>
)}

<div className="grid gap-3 pt-2 md:grid-cols-[1fr_auto]">
<button
type="button"
onClick={handleAdvancedAnalysis}
disabled={isAnalyzing}
className="revora-shine revora-lift rounded-2xl bg-slate-950 px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
>
{isAnalyzing ? "Analyse en cours..." : "Analyser mes leads"}
</button>

{enrichedLeads.length > 0 && (
<button
type="button"
onClick={downloadEnrichedCsv}
className="revora-lift rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-base font-semibold text-white transition hover:bg-white/15"
>
Télécharger Excel
</button>
)}
</div>

{isAnalyzing && analysisProgress.total > 0 && (
<div className="rounded-3xl border border-cyan-200 bg-slate-950 p-5 text-white shadow-2xl shadow-cyan-950/20">
<div className="flex items-start gap-4">
<div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/10">
<div className="revora-orbit absolute inset-1 rounded-2xl border-2 border-cyan-300 border-r-transparent" />
<span className="revora-pulse h-2.5 w-2.5 rounded-full bg-cyan-300" />
</div>

<div className="min-w-0 flex-1">
<div className="flex flex-wrap items-center justify-between gap-3">
<div>
<p className="text-sm font-semibold text-cyan-200">
Analyse IA en cours
</p>
<p className="mt-1 text-xs text-white/55">
Scoring, priorisation et recommandations commerciales
</p>
</div>

<div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
{analysisPercent}%
</div>
</div>

<div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
<div
className="revora-progress-loop h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400 transition-all duration-500"
style={{ width: `${Math.max(analysisPercent, 8)}%` }}
/>
</div>

{currentLeadPreview && (
<div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
<div className="flex flex-wrap items-center justify-between gap-3">
<p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
Lead en traitement
</p>
<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
#{currentLeadPreview.index}
</span>
</div>

<div className="mt-3 grid gap-2 sm:grid-cols-2">
{currentLeadCells.map((cell) => (
<div
key={`${currentLeadPreview.index}-${cell.header}`}
className="rounded-xl bg-slate-900/70 px-3 py-2"
>
<p className="text-[11px] uppercase tracking-[0.14em] text-white/35">
{cell.header}
</p>
<p className="mt-1 truncate text-sm font-medium text-white/85">
{cell.value}
</p>
</div>
))}
</div>
</div>
)}

<div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/55">
<span>
{analysisProgress.current} / {analysisProgress.total} leads traités
</span>
<span className="inline-flex items-center gap-1">
Traitement
<span className="revora-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
<span className="revora-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
<span className="revora-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
</span>
</div>
</div>
</div>
</div>
)}

{message && (
<p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
{message}
</p>
)}
</div>
</div>
</section>

{enrichedLeads.length > 0 && (
<section className="revora-glass revora-reveal rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
<div className="mb-6 flex flex-col gap-5">
<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
<div>
<p className="text-sm text-cyan-300">Résultats enrichis</p>
<h2 className="mt-1 text-2xl font-semibold text-white">
Analyse forte REVORA
</h2>
</div>

<div className="grid grid-cols-3 gap-3 md:w-[320px]">
<div className="revora-lift rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-center">
<p className="text-xs uppercase tracking-wider text-emerald-300">
GO
</p>
<p className="mt-2 text-xl font-semibold text-white">
{stats.go}
</p>
</div>

<div className="revora-lift rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-center">
<p className="text-xs uppercase tracking-wider text-amber-300">
MAYBE
</p>
<p className="mt-2 text-xl font-semibold text-white">
{stats.maybe}
</p>
</div>

<div className="revora-lift rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
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
<div className="relative">
<input
type="text"
placeholder="Rechercher un lead, une entreprise, un angle..."
value={searchTerm}
onChange={(event) => setSearchTerm(event.target.value)}
className="revora-lift w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-white outline-none placeholder:text-white/35"
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
</div>

<div className="mb-4 text-sm text-white/55">
{filteredLeads.length} résultat(s) affiché(s)
</div>

<div className="grid gap-4">
{filteredLeads.map((lead, index) => {
const isExpanded = expandedLeads.has(index);
const priorityAccent = lead.priority === "GO" ? "border-emerald-400/30" : lead.priority === "MAYBE" ? "border-amber-400/25" : "border-white/8";
const priorityBar = lead.priority === "GO" ? "bg-emerald-400" : lead.priority === "MAYBE" ? "bg-amber-400" : "bg-slate-600";
const scoreStroke = lead.leadScore >= 70 ? "#34d399" : lead.leadScore >= 40 ? "#fbbf24" : "#64748b";
const scoreDash = ((lead.leadScore / 100) * 87.96).toFixed(2);
return (
<div
key={index}
className={`revora-lift revora-card-premium revora-card-appear relative overflow-hidden rounded-2xl border bg-slate-950/60 ${priorityAccent}`}
>
<div className={`absolute left-0 top-0 h-full w-[3px] ${priorityBar}`} />
{/* Card header — always visible */}
<button
type="button"
onClick={() =>
setExpandedLeads((prev) => {
const next = new Set(prev);
if (next.has(index)) next.delete(index);
else next.add(index);
return next;
})
}
className="flex w-full items-start justify-between gap-4 py-5 pl-7 pr-5 text-left"
>
<div className="min-w-0 flex-1">
<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
<p className="text-base font-semibold text-white">
{lead.originalRow[0] || "Lead"}
</p>
{lead.originalRow[1] && (
<p className="text-sm text-white/45">{lead.originalRow[1]}</p>
)}
{lead.originalRow[2] && (
<p className="text-sm text-white/35">{lead.originalRow[2]}</p>
)}
</div>
<p className="mt-1.5 line-clamp-2 text-sm leading-6 text-white/55">
{lead.fitReason}
</p>
<div className="mt-3 flex flex-wrap gap-1.5">
{lead.bestOutreachChannel && (
<span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/60">
{lead.bestOutreachChannel}
</span>
)}
<span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
lead.confidenceLevel === "high" ? "bg-emerald-500/10 text-emerald-300" :
lead.confidenceLevel === "medium" ? "bg-amber-500/10 text-amber-300" :
"bg-white/5 text-white/45"
}`}>
{lead.confidenceLevel === "high" ? "Confiance haute" : lead.confidenceLevel === "medium" ? "Confiance moyenne" : "Confiance faible"}
</span>
<span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
lead.opportunityLevel === "high" ? "bg-blue-500/10 text-blue-300" :
lead.opportunityLevel === "medium" ? "bg-white/8 text-white/55" :
"bg-white/5 text-white/35"
}`}>
{lead.opportunityLevel === "high" ? "Opportunité forte" : lead.opportunityLevel === "medium" ? "Opportunité moyenne" : "Faible opportunité"}
</span>
<span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
lead.salesReadiness === "ready_for_meeting" ? "bg-cyan-500/10 text-cyan-300" :
lead.salesReadiness === "worth_testing" ? "bg-white/8 text-white/55" :
"bg-white/5 text-white/35"
}`}>
{lead.salesReadiness === "ready_for_meeting" ? "Prêt meeting" : lead.salesReadiness === "worth_testing" ? "À tester" : "Non prêt"}
</span>
</div>
</div>

<div className="flex shrink-0 flex-col items-end gap-3">
<div className="flex items-center gap-3">
<div className="relative h-12 w-12">
<svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
<circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
<circle
cx="18" cy="18" r="14"
fill="none"
stroke={scoreStroke}
strokeWidth="3"
strokeDasharray={`${scoreDash} 87.96`}
strokeLinecap="round"
/>
</svg>
<div className="absolute inset-0 flex items-center justify-center">
<span className="text-xs font-bold text-white">{lead.leadScore}</span>
</div>
</div>
<span className={`rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider ${getPriorityClasses(lead.priority)}`}>
{lead.priority}
</span>
</div>
<span className="text-xs text-white/25">
{isExpanded ? "▲" : "▼"}
</span>
</div>
</button>

{/* Expanded details */}
{isExpanded && (
<div className="border-t border-white/10 px-5 pb-5 pt-4">
<div className="grid gap-4 md:grid-cols-2">
<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-cyan-300">
Scores détaillés
</p>
<div className="mt-3 grid gap-2.5">
{(
[
{ label: "Fit ICP", value: lead.fitIcpScore, max: 25 },
{ label: "Rôle", value: lead.roleRelevanceScore, max: 20 },
{ label: "Qualité data", value: lead.dataQualityScore, max: 15 },
{ label: "Besoin", value: lead.needRelevanceScore, max: 20 },
{ label: "Actionnabilité", value: lead.actionabilityScore, max: 20 },
] as const
).map(({ label, value, max }) => (
<div key={label} className="grid gap-1">
<div className="flex items-center justify-between text-xs text-white/70">
<span>{label}</span>
<span className="font-semibold text-white/90">{value}/{max}</span>
</div>
<div className="h-1.5 overflow-hidden rounded-full bg-white/10">
<div
className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-500"
style={{ width: `${Math.round((value / max) * 100)}%` }}
/>
</div>
</div>
))}
</div>
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
<p className="mt-1 text-sm leading-7 text-white/60">
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
<div className="flex items-center justify-between gap-2">
<p className="text-xs uppercase tracking-wider text-cyan-300">Email idea</p>
{lead.emailIdea && (
<button
type="button"
onClick={() => handleCopy(`${index}-email`, lead.emailIdea)}
className="text-xs text-white/35 transition hover:text-white/65"
>
{copiedKey === `${index}-email` ? "✓ Copié" : "Copier"}
</button>
)}
</div>
<p className="mt-2 text-sm leading-7 text-white/80">{lead.emailIdea}</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<div className="flex items-center justify-between gap-2">
<p className="text-xs uppercase tracking-wider text-cyan-300">LinkedIn idea</p>
{lead.linkedinIdea && (
<button
type="button"
onClick={() => handleCopy(`${index}-linkedin`, lead.linkedinIdea)}
className="text-xs text-white/35 transition hover:text-white/65"
>
{copiedKey === `${index}-linkedin` ? "✓ Copié" : "Copier"}
</button>
)}
</div>
<p className="mt-2 text-sm leading-7 text-white/80">{lead.linkedinIdea}</p>
</div>

<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<div className="flex items-center justify-between gap-2">
<p className="text-xs uppercase tracking-wider text-cyan-300">Call opener</p>
{lead.callOpener && (
<button
type="button"
onClick={() => handleCopy(`${index}-call`, lead.callOpener)}
className="text-xs text-white/35 transition hover:text-white/65"
>
{copiedKey === `${index}-call` ? "✓ Copié" : "Copier"}
</button>
)}
</div>
<p className="mt-2 text-sm leading-7 text-white/80">{lead.callOpener}</p>
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
</div>
)}
</div>
);
})}
</div>
</section>
)}
</div>
</main>
</ProtectedPage>
);
}
