export type Sector = "SaaS" | "Data" | "Cyber" | "Fintech" | "Industrie" | "Autre";
export type CompanySize = "TPE" | "PME" | "ETI" | "Grand compte";
export type DealSize = "< 10k€" | "10-50k€" | "50k€+";
export type SalesCycle = "< 1 mois" | "1-3 mois" | "3 mois+";

export interface ICPConfig {
  sectors: Sector[];
  companySizes: CompanySize[];
  titles: string[];
  problems: string;
  dealSize: DealSize;
  salesCycle: SalesCycle;
}

/** Canonical lead fields detected from the CSV. */
export interface Lead {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  sector: string;
  size: string;
  linkedin: string;
  email: string;
  phone: string;
  source: string;
  /** Every original column, untouched, for the raw-data view + export. */
  raw: Record<string, string>;
}

export type Priority = "GO" | "MAYBE" | "SKIP";
export type Channel = "Cold Call" | "LinkedIn" | "Email" | "Multi-touch";

export interface Objection {
  objection: string;
  reponse: string;
}

export interface LeadScore {
  score: number;
  priority: Priority;
  veto: boolean;
  veto_reason: string | null;
  briefing: string;
  ouverture: string;
  recommended_channel: Channel;
  channel_reasoning: string;
  objections: Objection[];
  timing: string;
  piege: string;
}

/** A lead joined with its AI score (or an error if scoring failed). */
export interface ScoredLead {
  lead: Lead;
  score: LeadScore | null;
  error?: string;
}

export interface Analysis {
  id: string;
  name: string;
  createdAt: number;
  icp: ICPConfig;
  results: ScoredLead[];
}

/** CSV column → canonical Lead field mapping shown in the preview. */
export type FieldKey = keyof Omit<Lead, "raw">;

export interface ColumnMapping {
  field: FieldKey;
  label: string;
  column: string | null;
}
