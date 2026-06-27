import Papa from "papaparse";
import type { FieldKey, Lead } from "./types";

/** Alias lists per canonical field. Matching is accent/case/space-insensitive. */
const ALIASES: Record<FieldKey, string[]> = {
  firstName: ["firstname", "first name", "prenom", "given name"],
  lastName: ["lastname", "last name", "nom", "surname", "family name"],
  title: [
    "title",
    "titre",
    "job title",
    "poste",
    "fonction",
    "position",
    "role",
    "intitule",
  ],
  company: [
    "company",
    "entreprise",
    "societe",
    "organisation",
    "organization",
    "account",
    "compte",
  ],
  sector: ["sector", "secteur", "industry", "industrie", "domaine", "vertical"],
  size: [
    "size",
    "taille",
    "company size",
    "effectif",
    "headcount",
    "employees",
    "employes",
    "nb employes",
  ],
  linkedin: ["linkedin", "linkedin url", "linkedinurl", "profil linkedin", "li url"],
  email: ["email", "e mail", "mail", "courriel", "adresse email"],
  phone: ["phone", "telephone", "tel", "mobile", "numero"],
  source: ["source", "origine", "canal", "lead source", "provenance"],
};

const FIELDS = Object.keys(ALIASES) as FieldKey[];

/** Lowercase, strip accents and separators so headers match loosely. */
function normalize(s: string): string {
  const decomposed = s.toLowerCase().normalize("NFD");
  let out = "";
  for (const ch of decomposed) {
    if (ch.charCodeAt(0) > 127) continue; // drop combining marks / non-ASCII
    if (ch === "_" || ch === "-" || ch === ".") out += " ";
    else out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  /** Auto-detected mapping field -> header (or null when nothing matched). */
  mapping: Record<FieldKey, string | null>;
}

/** Auto-detect which header maps to each canonical field. */
export function detectMapping(headers: string[]): Record<FieldKey, string | null> {
  const normalized = headers.map((h) => ({ raw: h, norm: normalize(h) }));
  const mapping = {} as Record<FieldKey, string | null>;
  const used = new Set<string>();

  for (const field of FIELDS) {
    const aliases = ALIASES[field];
    let match: string | null = null;

    // 1) exact normalized match
    for (const alias of aliases) {
      const found = normalized.find((h) => h.norm === alias && !used.has(h.raw));
      if (found) {
        match = found.raw;
        break;
      }
    }
    // 2) contains match
    if (!match) {
      for (const alias of aliases) {
        const found = normalized.find(
          (h) => h.norm.includes(alias) && !used.has(h.raw)
        );
        if (found) {
          match = found.raw;
          break;
        }
      }
    }

    if (match) used.add(match);
    mapping[field] = match;
  }

  return mapping;
}

export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const headers = result.meta.fields ?? [];
  const rows = (result.data ?? []).filter((r) =>
    Object.values(r).some((v) => v && String(v).trim() !== "")
  );

  return { headers, rows, mapping: detectMapping(headers) };
}

/** Build canonical Leads from raw rows + a field->column mapping. */
export function buildLeads(
  rows: Record<string, string>[],
  mapping: Record<FieldKey, string | null>
): Lead[] {
  const get = (row: Record<string, string>, field: FieldKey): string => {
    const col = mapping[field];
    if (!col) return "";
    return (row[col] ?? "").toString().trim();
  };

  return rows.map((row) => ({
    firstName: get(row, "firstName"),
    lastName: get(row, "lastName"),
    title: get(row, "title"),
    company: get(row, "company"),
    sector: get(row, "sector"),
    size: get(row, "size"),
    linkedin: get(row, "linkedin"),
    email: get(row, "email"),
    phone: get(row, "phone"),
    source: get(row, "source"),
    raw: { ...row },
  }));
}
