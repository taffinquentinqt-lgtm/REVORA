import type {
  Sector,
  CompanySize,
  DealSize,
  SalesCycle,
  FieldKey,
} from "./types";

export const SECTORS: Sector[] = [
  "SaaS",
  "Data",
  "Cyber",
  "Fintech",
  "Industrie",
  "Autre",
];

export const COMPANY_SIZES: CompanySize[] = ["TPE", "PME", "ETI", "Grand compte"];

export const DEAL_SIZES: DealSize[] = ["< 10k€", "10-50k€", "50k€+"];

export const SALES_CYCLES: SalesCycle[] = ["< 1 mois", "1-3 mois", "3 mois+"];

export const FIELD_LABELS: Record<FieldKey, string> = {
  firstName: "Prénom",
  lastName: "Nom",
  title: "Titre",
  company: "Entreprise",
  sector: "Secteur",
  size: "Taille",
  linkedin: "LinkedIn",
  email: "Email",
  phone: "Téléphone",
  source: "Source",
};

export const MAX_LEADS = 200;
