export type StoredLead = {
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

export type StoredAnalysis = {
headers: string[];
leads: StoredLead[];
fileName: string;
updatedAt: string;
};

export type StoredExport = {
fileName: string;
format: string;
status: string;
createdAt: string;
leadCount: number;
type: string;
};

const ANALYSIS_KEY = "revora_latest_analysis";
const EXPORTS_KEY = "revora_exports";
const SETTINGS_KEY = "revora_settings";

export function saveAnalysis(payload: StoredAnalysis) {
if (typeof window === "undefined") return;
localStorage.setItem(ANALYSIS_KEY, JSON.stringify(payload));
}

export function getAnalysis(): StoredAnalysis | null {
if (typeof window === "undefined") return null;

const raw = localStorage.getItem(ANALYSIS_KEY);
if (!raw) return null;

try {
return JSON.parse(raw) as StoredAnalysis;
} catch {
return null;
}
}

export function saveExport(payload: StoredExport) {
if (typeof window === "undefined") return;

const current = getExports();
localStorage.setItem(EXPORTS_KEY, JSON.stringify([payload, ...current]));
}

export function getExports(): StoredExport[] {
if (typeof window === "undefined") return [];

const raw = localStorage.getItem(EXPORTS_KEY);
if (!raw) return [];

try {
return JSON.parse(raw) as StoredExport[];
} catch {
return [];
}
}

export function getSettings() {
if (typeof window === "undefined") {
return { exportFormat: "CSV" };
}

const raw = localStorage.getItem(SETTINGS_KEY);
if (!raw) {
return { exportFormat: "CSV" };
}

try {
return JSON.parse(raw) as { exportFormat: string };
} catch {
return { exportFormat: "CSV" };
}
}

export function saveSettings(settings: { exportFormat: string }) {
if (typeof window === "undefined") return;
localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
