export type RevoraClientBrief = {
offerDescription: string;
problemSolved: string;
targetCompanyTypes: string;
targetRoles: string;
};

export type RevoraGeneratedProfile = {
productSummary: string;
problemSummary: string;
valueProposition: string;
icpSummary: string;
targetFunctions: string[];
buyingSignals: string[];
businessPains: string[];
recommendedAngles: string[];
priorityLogic: string;
};

const BRIEF_KEY = "revora_client_brief";
const GENERATED_PROFILE_KEY = "revora_generated_profile";

export const DEFAULT_BRIEF: RevoraClientBrief = {
offerDescription: "",
problemSolved: "",
targetCompanyTypes: "",
targetRoles: "",
};

export const DEFAULT_GENERATED_PROFILE: RevoraGeneratedProfile = {
productSummary: "",
problemSummary: "",
valueProposition: "",
icpSummary: "",
targetFunctions: [],
buyingSignals: [],
businessPains: [],
recommendedAngles: [],
priorityLogic: "",
};

export function getClientBrief(): RevoraClientBrief {
if (typeof window === "undefined") return DEFAULT_BRIEF;

const raw = localStorage.getItem(BRIEF_KEY);
if (!raw) return DEFAULT_BRIEF;

try {
const parsed = JSON.parse(raw) as Partial<RevoraClientBrief>;
return {
offerDescription: parsed.offerDescription ?? "",
problemSolved: parsed.problemSolved ?? "",
targetCompanyTypes: parsed.targetCompanyTypes ?? "",
targetRoles: parsed.targetRoles ?? "",
};
} catch {
return DEFAULT_BRIEF;
}
}

export function saveClientBrief(brief: RevoraClientBrief) {
if (typeof window === "undefined") return;
localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
}

export function getGeneratedProfile(): RevoraGeneratedProfile {
if (typeof window === "undefined") return DEFAULT_GENERATED_PROFILE;

const raw = localStorage.getItem(GENERATED_PROFILE_KEY);
if (!raw) return DEFAULT_GENERATED_PROFILE;

try {
const parsed = JSON.parse(raw) as Partial<RevoraGeneratedProfile>;
return {
productSummary: parsed.productSummary ?? "",
problemSummary: parsed.problemSummary ?? "",
valueProposition: parsed.valueProposition ?? "",
icpSummary: parsed.icpSummary ?? "",
targetFunctions: parsed.targetFunctions ?? [],
buyingSignals: parsed.buyingSignals ?? [],
businessPains: parsed.businessPains ?? [],
recommendedAngles: parsed.recommendedAngles ?? [],
priorityLogic: parsed.priorityLogic ?? "",
};
} catch {
return DEFAULT_GENERATED_PROFILE;
}
}

export function saveGeneratedProfile(profile: RevoraGeneratedProfile) {
if (typeof window === "undefined") return;
localStorage.setItem(GENERATED_PROFILE_KEY, JSON.stringify(profile));
}

export function clearGeneratedProfile() {
if (typeof window === "undefined") return;
localStorage.removeItem(GENERATED_PROFILE_KEY);
}

function splitValues(value: string) {
return value
.split(",")
.map((item) => item.trim())
.filter(Boolean);
}

export function generateProfileFromBrief(
brief: RevoraClientBrief
): RevoraGeneratedProfile {
const roles = splitValues(brief.targetRoles);
const companies = splitValues(brief.targetCompanyTypes);

const buyingSignals = [
"équipe commerciale en place",
"besoin de mieux prioriser les leads",
"enjeu de productivité commerciale",
"volume de leads à arbitrer",
];

const businessPains = [
"perte de temps sur des leads peu qualifiés",
"manque de priorisation commerciale",
"outbound trop générique",
"difficulté à savoir quels leads traiter en premier",
];

const recommendedAngles = [
"gain de temps dans la qualification",
"meilleure priorisation commerciale",
"meilleure allocation de l’effort outbound",
"amélioration de la qualité des prises de contact",
];

const icpParts: string[] = [];

if (companies.length > 0) {
icpParts.push(`Entreprises cibles : ${companies.join(", ")}`);
}

if (roles.length > 0) {
icpParts.push(`Fonctions prioritaires : ${roles.join(", ")}`);
}

icpParts.push(
"Contexte prioritaire : organisation B2B avec besoin de mieux exploiter ses leads et mieux orienter l’effort commercial."
);

return {
productSummary:
brief.offerDescription ||
"Offre commerciale B2B nécessitant qualification et priorisation.",
problemSummary:
brief.problemSolved ||
"Le client cherche à résoudre un problème de ciblage, de qualification ou de priorisation commerciale.",
valueProposition:
"L’offre semble créer de la valeur en aidant les équipes à mieux traiter les opportunités les plus pertinentes et à éviter les efforts commerciaux peu rentables.",
icpSummary: icpParts.join(" "),
targetFunctions:
roles.length > 0
? roles
: ["Head of Sales", "Responsable commercial", "CEO"],
buyingSignals,
businessPains,
recommendedAngles,
priorityLogic:
"GO si le lead correspond bien à la cible, au rôle visé et présente assez d’éléments exploitables pour justifier une prise de contact. MAYBE si le fit est plausible mais incomplet. SKIP si le fit est faible ou si l’effort commercial paraît peu rentable.",
};
}