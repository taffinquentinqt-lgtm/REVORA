"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import TopNav from "../components/TopNav";
import ProtectedPage from "../components/ProtectedPage";
import {
getSettings,
saveAnalysis,
saveExport,
} from "../lib/revora-storage";

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
};

type RoleAnalysis = {
score: number;
label: string;
};

type SizeAnalysis = {
score: number;
label: string;
};

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
const [goThreshold, setGoThreshold] = useState(75);
const [maybeThreshold, setMaybeThreshold] = useState(45);
const [includeLinkedin, setIncludeLinkedin] = useState(true);
const [includePhone, setIncludePhone] = useState(true);
const [exportFormat, setExportFormat] = useState("CSV");

useEffect(() => {
const settings = getSettings();
setGoThreshold(settings.goThreshold);
setMaybeThreshold(settings.maybeThreshold);
setIncludeLinkedin(settings.includeLinkedin);
setIncludePhone(settings.includePhone);
setExportFormat(settings.exportFormat);
}, []);

const rowCount = useMemo(() => csvPreview.rows.length, [csvPreview.rows]);

const stats = useMemo(() => {
const go = enrichedLeads.filter((lead) => lead.priority === "GO").length;
const maybe = enrichedLeads.filter((lead) => lead.priority === "MAYBE").length;
const skip = enrichedLeads.filter((lead) => lead.priority === "SKIP").length;

return { go, maybe, skip };
}, [enrichedLeads]);

const averageScore = useMemo(() => {
if (enrichedLeads.length === 0) return 0;
const total = enrichedLeads.reduce((sum, lead) => sum + lead.leadScore, 0);
return Math.round(total / enrichedLeads.length);
}, [enrichedLeads]);

const topLeads = useMemo(() => enrichedLeads.slice(0, 5), [enrichedLeads]);

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
].join(" ")
);

return haystack.includes(normalizedSearch);
});
}, [enrichedLeads, activeFilter, searchTerm]);

function handleChange(
event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) {
const { name, value } = event.target;

setFormData((prev) => ({
...prev,
[name]: value,
}));
}

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

function findColumnIndex(headers: string[], possibleNames: string[]) {
return headers.findIndex((header) => {
const normalizedHeader = normalizeForSearch(header);
return possibleNames.some((name) =>
normalizedHeader.includes(normalizeForSearch(name))
);
});
}

function getCell(row: string[], index: number) {
if (index < 0) return "";
return row[index] ?? "";
}

function clampScore(score: number) {
return Math.max(0, Math.min(100, Math.round(score)));
}

function getPriority(score: number): Priority {
if (score >= goThreshold) return "GO";
if (score >= maybeThreshold) return "MAYBE";
return "SKIP";
}

function getTargetKeywords(target: string): string[] {
const stopWords = new Set([
"les",
"des",
"aux",
"pour",
"avec",
"dans",
"une",
"sur",
"par",
"and",
"the",
"du",
"de",
"la",
"le",
"et",
"ou",
"biz",
]);

return normalizeForSearch(target)
.split(/[^a-z0-9]+/g)
.map((word) => word.trim())
.filter((word) => word.length >= 4 && !stopWords.has(word));
}

function isGenericEmail(email: string) {
const normalized = normalizeForSearch(email);

return [
"info@",
"contact@",
"hello@",
"bonjour@",
"sales@",
"admin@",
"support@",
"office@",
"team@",
"marketing@",
].some((prefix) => normalized.startsWith(prefix));
}

function analyzeRole(title: string, target: string): RoleAnalysis {
const normalizedTitle = normalizeForSearch(title);
const targetKeywords = getTargetKeywords(target);

const highPriorityKeywords = [
"ceo",
"founder",
"fondateur",
"cofondateur",
"gerant",
"dirigeant",
"owner",
"president",
"directeur commercial",
"sales",
"business developer",
"bizdev",
"growth",
"revenue",
"marketing",
"head of sales",
"head of growth",
"head of marketing",
"account executive",
"sdr",
"bdr",
"vp sales",
];

const mediumPriorityKeywords = [
"operations",
"operation",
"customer success",
"partnership",
"partenariat",
"responsable",
"manager",
"directeur",
"commerce",
"commercial",
];

const lowPriorityKeywords = [
"assistant",
"assistante",
"stagiaire",
"intern",
"alternant",
"alternante",
"apprenti",
"apprentie",
];

if (!normalizedTitle) {
return { score: 0, label: "poste manquant" };
}

if (lowPriorityKeywords.some((keyword) => normalizedTitle.includes(keyword))) {
return { score: -20, label: "rôle peu décisionnaire" };
}

if (targetKeywords.some((keyword) => normalizedTitle.includes(keyword))) {
return { score: 20, label: "rôle aligné avec la cible" };
}

if (highPriorityKeywords.some((keyword) => normalizedTitle.includes(keyword))) {
return { score: 18, label: "rôle fortement pertinent" };
}

if (mediumPriorityKeywords.some((keyword) => normalizedTitle.includes(keyword))) {
return { score: 10, label: "rôle potentiellement pertinent" };
}

return { score: 4, label: "rôle peu qualifié" };
}

function analyzeCompanySize(sizeValue: string): SizeAnalysis {
const normalized = normalizeForSearch(sizeValue);

if (!normalized) {
return { score: 0, label: "taille inconnue" };
}

const numberMatch = normalized.match(/\d+/);
const sizeNumber = numberMatch ? Number(numberMatch[0]) : null;

if (sizeNumber === null || Number.isNaN(sizeNumber)) {
return { score: 4, label: "taille indiquée sans chiffre exploitable" };
}

if (sizeNumber <= 5) return { score: 2, label: "très petite structure" };
if (sizeNumber <= 20) return { score: 8, label: "petite structure réactive" };
if (sizeNumber <= 250) return { score: 12, label: "PME structurée" };
if (sizeNumber <= 1000) return { score: 9, label: "mid-market" };

return { score: 5, label: "grande structure" };
}

function buildLeadAnalysis(headers: string[], row: string[]): EnrichedLead {
const emailIndex = findColumnIndex(headers, ["email", "mail"]);
const companyIndex = findColumnIndex(headers, [
"entreprise",
"company",
"societe",
"société",
"organisation",
"organization",
"account",
]);
const nameIndex = findColumnIndex(headers, [
"nom",
"name",
"prenom",
"prénom",
"firstname",
"lastname",
"contact",
"full name",
]);
const titleIndex = findColumnIndex(headers, [
"poste",
"title",
"job",
"fonction",
"role",
"rôle",
]);
const websiteIndex = findColumnIndex(headers, [
"site",
"website",
"url",
"domaine",
"domain",
"web",
]);
const phoneIndex = findColumnIndex(headers, [
"phone",
"telephone",
"téléphone",
"mobile",
"tel",
]);
const linkedinIndex = findColumnIndex(headers, [
"linkedin",
"linkedin url",
"linkedin profile",
]);
const sectorIndex = findColumnIndex(headers, [
"secteur",
"industry",
"vertical",
"activité",
"activite",
"sector",
]);
const sizeIndex = findColumnIndex(headers, [
"employees",
"employee",
"effectif",
"taille",
"size",
"headcount",
]);
const countryIndex = findColumnIndex(headers, [
"country",
"pays",
"location",
"ville",
"city",
"region",
"région",
]);

const emailValue = getCell(row, emailIndex);
const companyValue = getCell(row, companyIndex);
const nameValue = getCell(row, nameIndex);
const titleValue = getCell(row, titleIndex);
const websiteValue = getCell(row, websiteIndex);
const phoneValue = getCell(row, phoneIndex);
const linkedinValue = getCell(row, linkedinIndex);
const sectorValue = getCell(row, sectorIndex);
const sizeValue = getCell(row, sizeIndex);
const countryValue = getCell(row, countryIndex);

const roleAnalysis = analyzeRole(titleValue, formData.target);
const sizeAnalysis = analyzeCompanySize(sizeValue);

const reasons: string[] = [];
let score = 0;

if (companyValue) {
score += 12;
reasons.push("entreprise présente");
} else {
reasons.push("entreprise manquante");
}

if (nameValue) {
score += 8;
reasons.push("contact nommé");
} else {
reasons.push("contact non nommé");
}

if (emailValue) {
if (isGenericEmail(emailValue)) {
score += 8;
reasons.push("email générique");
} else {
score += 20;
reasons.push("email direct");
}
} else {
reasons.push("email manquant");
}

if (includePhone && phoneValue) {
score += 8;
reasons.push("téléphone présent");
}

if (includeLinkedin && linkedinValue) {
score += 5;
reasons.push("profil LinkedIn présent");
}

if (websiteValue) {
score += 8;
reasons.push("site présent");
}

if (sectorValue) {
score += 6;
reasons.push("secteur renseigné");
}

if (countryValue) {
score += 3;
reasons.push("localisation présente");
}

score += roleAnalysis.score;
reasons.push(roleAnalysis.label);

score += sizeAnalysis.score;
reasons.push(sizeAnalysis.label);

if (!emailValue && !linkedinValue && !phoneValue) {
score -= 20;
reasons.push("aucun canal direct");
}

if (isGenericEmail(emailValue) && !nameValue && !titleValue) {
score -= 12;
reasons.push("contact peu individualisé");
}

const leadScore = clampScore(score);
const priority = getPriority(leadScore);

const companyText = companyValue || "cette entreprise";
const contactText = nameValue || "ce contact";
const titleText = titleValue || "ce décideur";
const offerText = formData.offerDescription.trim() || "ton offre";
const targetText = formData.target.trim() || "ta cible";

let whyNow = "";
let probableBusinessPains = "";
let detectedOpportunities = "";
let bestOutreachChannel = "";
let channelReason = "";
let emailIdea = "";
let linkedinIdea = "";
let callOpener = "";
let nextBestAction = "";

if (priority === "GO") {
whyNow = `${companyText} présente assez de signaux exploitables pour justifier une action commerciale rapide.`;
probableBusinessPains = `${titleText} peut perdre du temps à qualifier, prioriser ou structurer les actions commerciales.`;
detectedOpportunities = `${offerText} peut aider ${companyText} à mieux concentrer ses efforts et accélérer la prise de rendez-vous.`;

if (emailValue && phoneValue) {
bestOutreachChannel = "Multicanal";
channelReason =
"Le lead a plusieurs points de contact exploitables pour une séquence complète.";
} else if (emailValue && !isGenericEmail(emailValue)) {
bestOutreachChannel = "Email";
channelReason =
"Un email direct permet une prise de contact rapide et personnalisée.";
} else if (linkedinValue) {
bestOutreachChannel = "LinkedIn";
channelReason =
"LinkedIn est le canal le plus crédible quand l’email direct manque.";
} else {
bestOutreachChannel = "Call";
channelReason = "Le téléphone reste le meilleur canal disponible sur ce lead.";
}

emailIdea = `Objet : Priorisation commerciale chez ${companyText}\nBonjour ${contactText}, je pense qu’il y a un angle concret pour aider ${companyText} à mieux qualifier et prioriser ses leads. Ouvert à un échange rapide ?`;
linkedinIdea = `Bonjour ${contactText}, je pense qu’il y a un sujet intéressant autour de la priorisation commerciale chez ${companyText}. Partant pour en parler ?`;
callOpener = `Bonjour, je vous appelle car je pense qu’il y a un vrai sujet autour de la qualification et de la priorisation commerciale chez ${companyText}.`;
nextBestAction = `Lancer une prise de contact prioritaire avec un message personnalisé orienté ${targetText}.`;
} else if (priority === "MAYBE") {
whyNow = `${companyText} semble potentiellement pertinent, mais le niveau d’information ou de maturité reste partiel.`;
probableBusinessPains = `${titleText} peut rencontrer des difficultés de ciblage ou de structuration commerciale, sans urgence claire à ce stade.`;
detectedOpportunities = `Tester si ${companyText} rencontre un besoin lié à ${offerText}, avant d’investir plus de temps commercial.`;

if (emailValue) {
bestOutreachChannel = "Email";
channelReason =
"L’email est suffisant pour tester l’intérêt avec un effort mesuré.";
} else if (linkedinValue) {
bestOutreachChannel = "LinkedIn";
channelReason =
"LinkedIn permet une approche légère quand les données sont incomplètes.";
} else {
bestOutreachChannel = "Enrichissement puis contact";
channelReason =
"Le lead mérite d’être mieux qualifié avant une vraie séquence.";
}

emailIdea = `Objet : Sujet de qualification commerciale\nBonjour ${contactText}, je me permets de vous écrire car il pourrait y avoir un angle utile pour aider ${companyText} à mieux structurer ses actions commerciales.`;
linkedinIdea = `Bonjour ${contactText}, je pense qu’il y a peut-être un angle pour aider ${companyText} à mieux structurer sa prospection.`;
callOpener = `Bonjour, je voulais simplement valider si la qualification et la priorisation des leads est un sujet chez vous.`;
nextBestAction = `Faire une première prise de contact légère puis enrichir le lead si intérêt confirmé.`;
} else {
whyNow = `${companyText} ne présente pas assez de signaux exploitables pour justifier une action commerciale immédiate.`;
probableBusinessPains = `Le besoin potentiel reste trop flou pour être traité comme une vraie opportunité maintenant.`;
detectedOpportunities = `L’opportunité existe peut-être, mais elle doit d’abord être validée par un enrichissement de données.`;
bestOutreachChannel = "Enrichissement d'abord";
channelReason =
"Le coût de prospection serait trop élevé au regard du niveau de qualification actuel.";
emailIdea = "Lead trop peu qualifié pour proposer un email crédible.";
linkedinIdea =
"Lead trop peu qualifié pour proposer un message LinkedIn crédible.";
callOpener =
"Lead trop peu qualifié pour une approche téléphonique rentable.";
nextBestAction =
"Compléter les informations manquantes ou sortir le lead de la priorité immédiate.";
}

return {
originalRow: row,
leadScore,
priority,
fitReason: reasons.join(" • "),
whyNow,
probableBusinessPains,
detectedOpportunities,
bestOutreachChannel,
channelReason,
emailIdea,
linkedinIdea,
callOpener,
nextBestAction,
};
}

function validateBeforeAnalysis() {
if (!formData.companyName.trim()) {
setMessage("Le nom de l’entreprise est requis.");
return false;
}

if (!formData.companyDescription.trim()) {
setMessage("La description entreprise est requise.");
return false;
}

if (!formData.offerDescription.trim()) {
setMessage("La description offre est requise.");
return false;
}

if (!formData.target.trim()) {
setMessage("La cible est requise.");
return false;
}

if (!csvFile) {
setMessage("Merci d’ajouter un fichier CSV.");
return false;
}

if (csvPreview.headers.length === 0) {
setMessage("Le CSV est vide ou non lisible.");
return false;
}

return true;
}

function handleAdvancedAnalysis() {
if (!validateBeforeAnalysis()) return;

try {
setIsAnalyzing(true);
setMessage("Analyse avancée en cours...");

const results = csvPreview.rows.map((row) =>
buildLeadAnalysis(csvPreview.headers, row)
);

results.sort((a, b) => b.leadScore - a.leadScore);

setEnrichedLeads(results);
setActiveFilter("ALL");

saveAnalysis({
headers: csvPreview.headers,
leads: results,
fileName: csvFile?.name || "revora_leads.csv",
updatedAt: new Date().toLocaleString("fr-FR"),
});

setMessage(
`Analyse avancée terminée ✅ ${results.length} lead(s) enrichi(s). Seuils utilisés : GO ${goThreshold} / MAYBE ${maybeThreshold}.`
);
} finally {
setIsAnalyzing(false);
}
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

function escapeCsvCell(value: string | number) {
const stringValue = String(value ?? "");
const escapedValue = stringValue.replace(/"/g, '""');
return `"${escapedValue}"`;
}

function buildEnrichedCsv() {
if (csvPreview.headers.length === 0 || enrichedLeads.length === 0) {
return "";
}

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
];

const enrichedRows = enrichedLeads.map((lead) => [
...lead.originalRow,
String(lead.leadScore),
lead.priority,
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
]);

const csvLines = [
enrichedHeaders.map(escapeCsvCell).join(","),
...enrichedRows.map((row) => row.map(escapeCsvCell).join(",")),
];

return csvLines.join("\n");
}

function downloadEnrichedCsv() {
const enrichedCsv = buildEnrichedCsv();

if (!enrichedCsv) {
setMessage("Aucun CSV enrichi à télécharger.");
return;
}

const blob = new Blob([enrichedCsv], {
type: "text/csv;charset=utf-8;",
});

const url = URL.createObjectURL(blob);
const link = document.createElement("a");
const originalFileName =
csvFile?.name?.replace(".csv", "") || "revora_leads";

const extension = exportFormat.toLowerCase();
const finalFileName = `${originalFileName}_enrichi_avance.${extension}`;

link.href = url;
link.download = finalFileName;

document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);

saveExport({
fileName: finalFileName,
format: exportFormat,
status: "READY",
createdAt: new Date().toLocaleString("fr-FR"),
leadCount: enrichedLeads.length,
type: "Leads enrichis",
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
<div
className="absolute inset-0 bg-cover bg-center"
style={{ backgroundImage: "url('/revora-hero.jpg')" }}
/>
<div className="absolute inset-0 bg-slate-950/75" />
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_30%),radial-gradient(circle_at_left,rgba(34,211,238,0.15),transparent_20%)]" />

<div className="relative p-8 md:p-10">
<p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Sales intelligence
</p>

<h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
Transforme tes leads en
<span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
{" "}
plan d’action commercial.
</span>
</h1>

<p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
Upload ton CSV, détecte les meilleurs contacts, trie ton pipeline
et exporte un fichier enrichi depuis un vrai dashboard SaaS.
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
Seuils actifs
</p>
<p className="mt-2 text-lg font-semibold text-white">
GO {goThreshold} / MAYBE {maybeThreshold}
</p>
</div>
</div>
</div>
</div>

<div className="rounded-[32px] border border-white/10 bg-white p-7 text-slate-900 shadow-2xl shadow-slate-950/30">
<div className="mb-6 flex items-center justify-between">
<div>
<p className="text-sm font-medium text-blue-600">Analyse avancée</p>
<h2 className="mt-1 text-2xl font-semibold">
Configure ton analyse
</h2>
</div>

<div className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 md:block">
V16
</div>
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
placeholder="Ex: REVORA"
value={formData.companyName}
onChange={handleChange}
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
placeholder="Ex: Nous aidons les équipes commerciales B2B à mieux qualifier et prioriser leurs leads."
value={formData.companyDescription}
onChange={handleChange}
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
placeholder="Ex: Solution qui aide les équipes sales à scorer, prioriser et préparer les actions commerciales."
value={formData.offerDescription}
onChange={handleChange}
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
placeholder="Ex: SDR, Biz Dev, Head of Sales, dirigeants PME"
value={formData.target}
onChange={handleChange}
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
Seuils actifs : GO {goThreshold} / MAYBE {maybeThreshold} ·
LinkedIn {includeLinkedin ? "activé" : "désactivé"} · Téléphone{" "}
{includePhone ? "activé" : "désactivé"} · Export {exportFormat}
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

{message && (
<p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
{message}
</p>
)}
</div>
</div>
</section>

<section className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
<div className="grid gap-8">
<div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
<div className="mb-5 flex items-center justify-between">
<div>
<p className="text-sm text-cyan-300">CSV overview</p>
<h2 className="mt-1 text-2xl font-semibold text-white">
Aperçu du fichier
</h2>
</div>

<div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
Data intake
</div>
</div>

{!csvFile && (
<p className="text-sm leading-7 text-white/65">
Ajoute un fichier CSV pour afficher les colonnes détectées,
le volume de leads et préparer l’analyse.
</p>
)}

{csvFile && (
<div className="space-y-4">
<div className="grid gap-4 sm:grid-cols-2">
<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-white/45">
Nom du fichier
</p>
<p className="mt-2 font-medium text-white">{csvFile.name}</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-wider text-white/45">
Nombre de leads
</p>
<p className="mt-2 text-2xl font-semibold text-white">
{rowCount}
</p>
</div>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
<p className="mb-3 text-xs uppercase tracking-wider text-white/45">
Colonnes détectées
</p>
<div className="flex flex-wrap gap-2">
{csvPreview.headers.length > 0 ? (
csvPreview.headers.map((header, index) => (
<span
key={`${header}-${index}`}
className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
>
{header}
</span>
))
) : (
<p className="text-sm text-white/60">
Aucune colonne détectée.
</p>
)}
</div>
</div>
</div>
)}
</div>

{topLeads.length > 0 && (
<div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
<div className="mb-5">
<p className="text-sm text-cyan-300">Priorité immédiate</p>
<h2 className="mt-1 text-2xl font-semibold text-white">
Top leads
</h2>
</div>

<div className="grid gap-3">
{topLeads.map((lead, index) => (
<div
key={index}
className="rounded-2xl border border-white/10 bg-white/5 p-4"
>
<div className="mb-3 flex items-start justify-between gap-4">
<div>
<p className="font-medium text-white">
{lead.originalRow[0] || "Lead sans nom"}
</p>
<p className="mt-1 text-sm text-white/55">
{lead.fitReason}
</p>
</div>

<div className="flex items-center gap-2">
<span className="text-lg font-semibold text-white">
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

<p className="text-sm leading-7 text-white/70">
{lead.nextBestAction}
</p>
</div>
))}
</div>
</div>
)}
</div>

{enrichedLeads.length > 0 && (
<section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
<div className="mb-6 flex flex-col gap-5">
<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
<div>
<p className="text-sm text-cyan-300">Résultats enrichis</p>
<h2 className="mt-1 text-2xl font-semibold text-white">
Tableau d’analyse REVORA
</h2>
<p className="mt-2 text-sm text-white/60">
Pipeline filtrable, recherche intégrée et vue plus propre.
</p>
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

<div className="overflow-auto rounded-3xl border border-white/10">
<table className="min-w-full border-collapse text-sm">
<thead className="bg-white/10 text-white">
<tr>
{csvPreview.headers.map((header, index) => (
<th
key={`${header}-${index}`}
className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl"
>
{header}
</th>
))}
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Score
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Priorité
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Fit reason
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Why now
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Pains
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Opportunities
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Best channel
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Channel reason
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Email idea
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
LinkedIn idea
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
Call opener
</th>
<th className="sticky top-0 border-b border-white/10 px-3 py-3 text-left font-semibold backdrop-blur-xl">
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
{csvPreview.headers.map((_, cellIndex) => (
<td key={cellIndex} className="px-3 py-3">
{lead.originalRow[cellIndex] ?? ""}
</td>
))}

<td className="px-3 py-3 font-semibold text-white">
{lead.leadScore}
</td>

<td className="px-3 py-3">
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
lead.priority
)}`}
>
{lead.priority}
</span>
</td>

<td className="px-3 py-3">{lead.fitReason}</td>
<td className="px-3 py-3">{lead.whyNow}</td>
<td className="px-3 py-3">{lead.probableBusinessPains}</td>
<td className="px-3 py-3">{lead.detectedOpportunities}</td>
<td className="px-3 py-3">{lead.bestOutreachChannel}</td>
<td className="px-3 py-3">{lead.channelReason}</td>
<td className="px-3 py-3">{lead.emailIdea}</td>
<td className="px-3 py-3">{lead.linkedinIdea}</td>
<td className="px-3 py-3">{lead.callOpener}</td>
<td className="px-3 py-3">{lead.nextBestAction}</td>
</tr>
))}
</tbody>
</table>
</div>
</section>
)}
</section>
</div>
</main>
</ProtectedPage>
);
}