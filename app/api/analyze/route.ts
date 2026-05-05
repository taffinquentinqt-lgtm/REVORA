import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

type GeneratedProfile = {
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

export async function POST(req: Request) {
try {
const body = await req.json();

const {
brief,
generatedProfile,
headers,
rows,
}: {
brief: {
offerDescription: string;
problemSolved: string;
targetCompanyTypes: string;
targetRoles: string;
};
generatedProfile: GeneratedProfile;
headers: string[];
rows: string[][];
} = body;

if (!process.env.OPENAI_API_KEY) {
return NextResponse.json(
{ error: "OPENAI_API_KEY introuvable côté serveur." },
{ status: 500 }
);
}

if (!brief || !generatedProfile || !headers || !rows) {
return NextResponse.json(
{ error: "Données incomplètes pour l’analyse CSV." },
{ status: 400 }
);
}

if (!Array.isArray(headers) || !Array.isArray(rows)) {
return NextResponse.json(
{ error: "Format CSV invalide." },
{ status: 400 }
);
}

if (rows.length === 0) {
return NextResponse.json(
{ error: "Aucune ligne à analyser." },
{ status: 400 }
);
}

const csvData = rows.map((row, rowIndex) => {
const obj: Record<string, string | number> = {
__row_index: rowIndex,
};

headers.forEach((header, index) => {
obj[header] = row[index] ?? "";
});

return obj;
});

const prompt = `
Tu es SalesPilote, expert en qualification et préparation commerciale B2B.

Mission :
Transformer chaque lead d’un CSV en décision commerciale exploitable.

Règles générales :
- Ne jamais inventer une donnée absente.
- Ne jamais présenter une hypothèse comme un fait.
- Respecter strictement le brief client.
- Réponses courtes, concrètes, orientées action.
- Retourner uniquement un JSON valide.

Brief client :
${JSON.stringify(brief, null, 2)}

Profil d’analyse enrichi :
${JSON.stringify(generatedProfile, null, 2)}

Logique d’évaluation :
Attribue pour chaque lead :
- fit_icp_score /25
- role_relevance_score /20
- data_quality_score /15
- need_relevance_score /20
- actionability_score /20

lead_score = somme des 5 sous-scores, total sur 100.

Priorités :
- GO = fit crédible, canal exploitable, angle défendable, effort rentable
- MAYBE = potentiel réel mais incomplet
- SKIP = faible fit, faible besoin, rôle éloigné, données faibles ou effort peu rentable

Veto GO :
Un lead ne peut pas être GO si :
- aucun canal exploitable
- rôle manifestement hors cible
- données trop faibles pour agir
- fit cible trop faible

Confiance :
- high = données suffisantes + fit lisible + angle crédible
- medium = plausible mais incomplet
- low = fragile, trop d’hypothèses ou données faibles

Profondeur :
- basic = score + décision + action simple
- advanced = analyse plus poussée

Canaux autorisés :
- Email
- LinkedIn
- Call
- Multicanal
- Enrichissement d'abord
- Nurture léger

Logique canal :
- Email si email dispo + angle crédible
- LinkedIn si contact identifiable mais email faible/absent
- Call si téléphone dispo + priorité forte
- Multicanal si lead fort + plusieurs canaux
- Enrichissement d'abord si potentiel mais données insuffisantes
- Nurture léger si lead faible mais pas absurde

Actions autorisées :
- envoyer un email personnalisé
- tenter un message LinkedIn
- appeler directement
- lancer une séquence multicanale
- enrichir avant contact
- garder en watchlist
- sortir du pipe court terme

Style de sortie :
- fit_reason = 1 phrase
- why_now = 1 phrase
- channel_reason = 1 phrase
- probable_business_pains = 1 à 2 éléments
- detected_opportunities = 1 à 2 éléments
- email_idea = court
- linkedin_idea = court
- call_opener = 1 phrase
- probable_objection = réaliste
- objection_handling = court, calme, non agressif
- discovery_focus = 1 phrase
- questions_to_ask = 2 à 4 questions courtes
- value_hypothesis = 1 phrase
- handoff_note = court

Lecture senior :
Inclure aussi :
- opportunity_level = low | medium | high
- deal_potential = low | medium | high
- pain_clarity = low | medium | high
- urgency_level = low | medium | high
- sales_readiness = not_ready | worth_testing | ready_for_meeting

Contraintes :
- Analyser toutes les lignes.
- Retourner exactement 1 résultat par lead.
- Respecter l’ordre des leads.
- Vérifier cohérence score / priorité / veto / confiance / canal.

Format JSON obligatoire :
{
"results": [
{
"row_index": 0,
"lead_score": 0,
"priority": "GO",
"confidence_level": "high",
"analysis_depth": "advanced",
"fit_icp_score": 0,
"role_relevance_score": 0,
"data_quality_score": 0,
"need_relevance_score": 0,
"actionability_score": 0,
"fit_reason": "string",
"why_now": "string",
"probable_business_pains": ["string", "string"],
"detected_opportunities": ["string", "string"],
"best_outreach_channel": "Email",
"channel_reason": "string",
"email_idea": "string",
"linkedin_idea": "string",
"call_opener": "string",
"next_best_action": "envoyer un email personnalisé",
"probable_objection": "string",
"objection_handling": "string",
"opportunity_level": "medium",
"deal_potential": "medium",
"pain_clarity": "medium",
"urgency_level": "medium",
"sales_readiness": "worth_testing",
"discovery_focus": "string",
"questions_to_ask": ["string", "string"],
"value_hypothesis": "string",
"handoff_note": "string"
}
]
}

Leads à analyser :
${JSON.stringify(csvData, null, 2)}
`;

const response = await client.responses.create({
model: "gpt-5.5",
input: [
{
role: "user",
content: `Tu réponds uniquement avec un objet JSON valide. Aucun texte hors JSON.\n\n${prompt}`,
},
],
reasoning: { effort: "medium" },
});

const text = response.output_text?.trim();

if (!text) {
return NextResponse.json(
{ error: "Réponse IA vide." },
{ status: 500 }
);
}

let parsed: { results?: Array<Record<string, unknown>> };
try {
parsed = JSON.parse(text);
} catch {
return NextResponse.json(
{
error: "La réponse IA n’est pas un JSON valide.",
raw: text,
},
{ status: 500 }
);
}

if (!parsed.results || !Array.isArray(parsed.results)) {
return NextResponse.json(
{
error: "Format de réponse IA invalide : results manquant ou invalide.",
raw: parsed,
},
{ status: 500 }
);
}

if (parsed.results.length !== rows.length) {
return NextResponse.json(
{
error: `L'IA a retourné ${parsed.results.length} résultats pour ${rows.length} leads.`,
raw: parsed,
},
{ status: 500 }
);
}

const normalizedResults = [...parsed.results]
.sort((a, b) => Number(a.row_index) - Number(b.row_index))
.map((item) => ({
row_index: Number(item.row_index) || 0,
lead_score: Number(item.lead_score) || 0,
priority: item.priority || "MAYBE",
confidence_level: item.confidence_level || "medium",
analysis_depth: item.analysis_depth || "basic",

fit_icp_score: Number(item.fit_icp_score) || 0,
role_relevance_score: Number(item.role_relevance_score) || 0,
data_quality_score: Number(item.data_quality_score) || 0,
need_relevance_score: Number(item.need_relevance_score) || 0,
actionability_score: Number(item.actionability_score) || 0,

fit_reason: item.fit_reason || "",
why_now: item.why_now || "",
probable_business_pains: Array.isArray(item.probable_business_pains)
? item.probable_business_pains
: [],
detected_opportunities: Array.isArray(item.detected_opportunities)
? item.detected_opportunities
: [],

best_outreach_channel: item.best_outreach_channel || "",
channel_reason: item.channel_reason || "",
email_idea: item.email_idea || "",
linkedin_idea: item.linkedin_idea || "",
call_opener: item.call_opener || "",
next_best_action: item.next_best_action || "",

probable_objection: item.probable_objection || "",
objection_handling: item.objection_handling || "",

opportunity_level: item.opportunity_level || "medium",
deal_potential: item.deal_potential || "medium",
pain_clarity: item.pain_clarity || "medium",
urgency_level: item.urgency_level || "medium",
sales_readiness: item.sales_readiness || "worth_testing",
discovery_focus: item.discovery_focus || "",
questions_to_ask: Array.isArray(item.questions_to_ask)
? item.questions_to_ask
: [],
value_hypothesis: item.value_hypothesis || "",
handoff_note: item.handoff_note || "",
}));

return NextResponse.json({ results: normalizedResults });
} catch (error: unknown) {
console.error("analyze error:", error);

return NextResponse.json(
{
error:
error instanceof Error
? error.message
: "Impossible d’analyser le CSV avec OpenAI.",
},
{ status: 500 }
);
}
}
