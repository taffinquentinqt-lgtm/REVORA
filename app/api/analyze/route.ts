import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompt";
import type {
  ICPConfig,
  Lead,
  LeadScore,
  Priority,
  Channel,
  Confidence,
  CriterionScore,
  ScoringBreakdown,
  ScoredLead,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Moteur : Google Gemini (REST, sans SDK). Modèle avec quota gratuit actif.
const MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_BATCH = 10;
// Généreux : le brief enrichi (scoring 4 axes + persona + briefing + ouverture +
// 3 objections + timing + piège) ne doit JAMAIS être tronqué — cause n°1 des
// champs vides.
const MAX_TOKENS = 6144;
// Bas : le scoring doit être stable et reproductible, pas créatif.
const TEMPERATURE = 0.4;
const VALID_PRIORITIES: Priority[] = ["GO", "MAYBE", "SKIP"];
const VALID_CHANNELS: Channel[] = ["Cold Call", "LinkedIn", "Email", "Multi-touch"];
const VALID_CONFIDENCE: Confidence[] = ["haute", "moyenne", "faible"];

interface AnalyzeBody {
  icp?: ICPConfig;
  leads?: Lead[];
}

/** Pull the first balanced JSON object out of a model response. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Aucun JSON trouvé dans la réponse");
  }
  return candidate.slice(start, end + 1);
}

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function clampNote(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(10, Math.round(v)));
}

function normalizeCriterion(raw: unknown): CriterionScore {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return { note: clampNote(o.note), raison: String(o.raison ?? "").trim() };
}

/** Validate + normalize the raw parsed object into a LeadScore. */
function normalizeScore(raw: Record<string, unknown>): LeadScore {
  const veto = Boolean(raw.veto);
  let score = clampScore(raw.score);
  // Rule: veto forces score <= 25
  if (veto && score > 25) score = 25;

  let priority = VALID_PRIORITIES.includes(raw.priority as Priority)
    ? (raw.priority as Priority)
    : score >= 75
    ? "GO"
    : score >= 40
    ? "MAYBE"
    : "SKIP";
  // Keep priority coherent with a veto
  if (veto) priority = "SKIP";

  const confidence = VALID_CONFIDENCE.includes(raw.confidence as Confidence)
    ? (raw.confidence as Confidence)
    : "moyenne";

  const channel = VALID_CHANNELS.includes(raw.recommended_channel as Channel)
    ? (raw.recommended_channel as Channel)
    : "Multi-touch";

  const rawScoring =
    raw.scoring && typeof raw.scoring === "object"
      ? (raw.scoring as Record<string, unknown>)
      : {};
  const scoring: ScoringBreakdown = {
    fit_titre: normalizeCriterion(rawScoring.fit_titre),
    fit_secteur: normalizeCriterion(rawScoring.fit_secteur),
    fit_taille: normalizeCriterion(rawScoring.fit_taille),
    fit_probleme: normalizeCriterion(rawScoring.fit_probleme),
  };

  const objections = Array.isArray(raw.objections)
    ? raw.objections
        .filter((o): o is Record<string, unknown> => !!o && typeof o === "object")
        .map((o) => ({
          objection: String(o.objection ?? "").trim(),
          reponse: String(o.reponse ?? "").trim(),
        }))
        .filter((o) => o.objection && o.reponse)
    : [];

  return {
    score,
    priority,
    confidence,
    veto,
    veto_reason: raw.veto_reason ? String(raw.veto_reason) : null,
    scoring,
    persona: String(raw.persona ?? "").trim(),
    briefing: String(raw.briefing ?? "").trim(),
    ouverture: String(raw.ouverture ?? "").trim(),
    recommended_channel: channel,
    channel_reasoning: String(raw.channel_reasoning ?? "").trim(),
    objections,
    timing: String(raw.timing ?? "").trim(),
    piege: String(raw.piege ?? "").trim(),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Liste des champs obligatoires restés vides — sert à décider d'une relance. */
function missingFields(s: LeadScore): string[] {
  const missing: string[] = [];
  if (!s.persona) missing.push("persona");
  if (!s.briefing) missing.push("briefing");
  if (!s.ouverture) missing.push("ouverture");
  if (!s.channel_reasoning) missing.push("channel_reasoning");
  if (!s.timing) missing.push("timing");
  if (!s.piege) missing.push("piege");
  if (s.objections.length < 2) missing.push("objections");
  if (s.veto && !s.veto_reason) missing.push("veto_reason");
  // Scoring décomposé : au moins un axe doit être justifié (sinon réponse creuse)
  const noScoring =
    !s.scoring.fit_titre.raison &&
    !s.scoring.fit_secteur.raison &&
    !s.scoring.fit_taille.raison &&
    !s.scoring.fit_probleme.raison;
  if (noScoring) missing.push("scoring");
  return missing;
}

interface GeminiResult {
  text: string;
  truncated: boolean;
}

/** Appel Gemini (REST). Retourne le texte concaténé + drapeau de troncature. */
async function callGemini(
  apiKey: string,
  userMessage: string
): Promise<GeminiResult> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_TOKENS,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      finishReason?: string;
    }[];
  };
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
  return { text, truncated: candidate?.finishReason === "MAX_TOKENS" };
}

async function scoreLead(
  apiKey: string,
  icp: ICPConfig,
  lead: Lead
): Promise<ScoredLead> {
  let lastErr = "";
  let best: LeadScore | null = null;
  // initial try + 2 retries
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { text, truncated } = await callGemini(
        apiKey,
        buildUserMessage(icp, lead)
      );

      // Réponse tronquée => on relance plutôt que d'accepter un JSON coupé.
      if (truncated) {
        lastErr = "Réponse tronquée (max_tokens)";
        if (attempt < 2) await sleep(400 * (attempt + 1));
        continue;
      }

      const parsed = JSON.parse(extractJson(text)) as Record<string, unknown>;
      const score = normalizeScore(parsed);

      const missing = missingFields(score);
      if (missing.length === 0) {
        return { lead, score }; // tout est rempli
      }

      // Incomplet : on garde le meilleur essai et on relance.
      best = score;
      lastErr = `Champs vides: ${missing.join(", ")}`;
      if (attempt < 2) await sleep(400 * (attempt + 1));
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      if (attempt < 2) await sleep(400 * (attempt + 1));
    }
  }
  // Aucun essai 100% complet : on renvoie le meilleur obtenu (jamais null si
  // au moins un parse a réussi), sinon une erreur.
  if (best) return { lead, score: best, error: lastErr };
  return { lead, score: null, error: lastErr || "Échec du scoring" };
}

export async function POST(req: NextRequest) {
  // Auth + rate limit obligatoires avant tout appel modèle.
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY manquante côté serveur." },
      { status: 500 }
    );
  }

  let body: AnalyzeBody;
  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const { icp, leads } = body;
  if (!icp || !Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json(
      { error: "Requête invalide : icp et leads requis." },
      { status: 400 }
    );
  }
  if (leads.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Batch trop large (max ${MAX_BATCH}).` },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.all(
      leads.map((lead) => scoreLead(apiKey, icp, lead))
    );
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
