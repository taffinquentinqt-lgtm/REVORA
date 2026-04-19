export type Priority = "GO" | "MAYBE" | "SKIP";

export type StoredLead = {
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

export type StoredAnalysisData = {
headers: string[];
leads: StoredLead[];
fileName: string;
updatedAt: string;
};

export type StoredExportItem = {
fileName: string;
format: string;
status: "READY" | "PROCESSING" | "ARCHIVED";
createdAt: string;
leadCount: number;
type: string;
};

export type StoredSettings = {
goThreshold: number;
maybeThreshold: number;
includeLinkedin: boolean;
includePhone: boolean;
exportFormat: string;
saveHistory: boolean;
};

const ANALYSIS_KEY = "revora_last_analysis";
const EXPORTS_KEY = "revora_exports_history";
const SETTINGS_KEY = "revora_settings";

const DEFAULT_SETTINGS: StoredSettings = {
goThreshold: 75,
maybeThreshold: 45,
includeLinkedin: true,
includePhone: true,
exportFormat: "CSV",
saveHistory: true,
};

export function saveAnalysis(data: StoredAnalysisData) {
if (typeof window === "undefined") return;
localStorage.setItem(ANALYSIS_KEY, JSON.stringify(data));
}

export function getAnalysis(): StoredAnalysisData | null {
if (typeof window === "undefined") return null;

const raw = localStorage.getItem(ANALYSIS_KEY);
if (!raw) return null;

try {
return JSON.parse(raw) as StoredAnalysisData;
} catch {
return null;
}
}

export function saveExport(item: StoredExportItem) {
if (typeof window === "undefined") return;

const settings = getSettings();
if (!settings.saveHistory) return;

const current = getExports();
const next = [item, ...current];
localStorage.setItem(EXPORTS_KEY, JSON.stringify(next));
}

export function getExports(): StoredExportItem[] {
if (typeof window === "undefined") return [];

const raw = localStorage.getItem(EXPORTS_KEY);
if (!raw) return [];

try {
return JSON.parse(raw) as StoredExportItem[];
} catch {
return [];
}
}

export function saveSettings(settings: StoredSettings) {
if (typeof window === "undefined") return;
localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSettings(): StoredSettings {
if (typeof window === "undefined") return DEFAULT_SETTINGS;

const raw = localStorage.getItem(SETTINGS_KEY);
if (!raw) return DEFAULT_SETTINGS;

try {
return {
...DEFAULT_SETTINGS,
...(JSON.parse(raw) as Partial<StoredSettings>),
};
} catch {
return DEFAULT_SETTINGS;
}
}

export function getDefaultSettings(): StoredSettings {
return DEFAULT_SETTINGS;
}