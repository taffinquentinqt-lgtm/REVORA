import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
apiKey: process.env.MAMMOUTH_API_KEY,
baseURL: "https://api.mammouth.ai/v1",
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

if (!process.env.MAMMOUTH_API_KEY) {
return NextResponse.json(
{ error: "MAMMOUTH_API_KEY introuvable dans .env.local" },
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
Tu es SalesPilote, un agent IA expert en qualification, priorisation et préparation commerciale B2B.

CONTEXTE CLIENT
- Offre : ${brief.offerDescription}
- Problème résolu : ${brief.problemSolved}
- Type d’entreprise ciblé : ${brief.targetCompanyTypes}
- Profils visés : ${brief.targetRoles}

PROFIL ENRICHI
- Produit compris : ${generatedProfile.productSummary}
- Problème résolu : ${generatedProfile.problemSummary}
- Promesse de valeur : ${generatedProfile.valueProposition}
- ICP probable : ${generatedProfile.icpSummary}
- Fonctions cibles : ${generatedProfile.targetFunctions.join(", ")}
- Signaux d’achat : ${generatedProfile.buyingSignals.join(", ")}
- Douleurs business : ${generatedProfile.businessPains.join(", ")}
- Angles recommandés : ${generatedProfile.recommendedAngles.join(", ")}
- Logique de priorité : ${generatedProfile.priorityLogic}

MISSION
Analyse CHAQUE lead.
Tu dois produire EXACTEMENT ${csvData.length} résultats, un par lead, dans le même ordre.

RÈGLES
- Ne jamais inventer une donnée absente
- Ne jamais présenter une hypothèse comme un fait
- Rester crédible, concret et utile
- Écrire en français
- Répondre uniquement avec du JSON valide

SCORING
- Fit avec l’ICP : /25
- Maturité probable : /20
- Signaux d’achat plausibles : /20
- Pertinence probable du besoin : /20
- Actionnabilité commerciale : /15

PRIORITÉS
- GO
- MAYBE
- SKIP

VALEURS AUTORISÉES
- best_outreach_channel : Email | LinkedIn | Call | Multicanal | Enrichissement d'abord | Nurture léger
- next_best_action : envoyer un email personnalisé | tenter un message LinkedIn | appeler directement | lancer une séquence multicanale | enrichir avant contact | garder en watchlist | sortir du pipe court terme
- effort_level : low | medium | high | no effort
- confidence_level : high | medium | low
- opportunity_level : low | medium | high
- deal_potential : low | medium | high
- pain_clarity : low | medium | high
- urgency_level : low | medium | high
- sales_readiness : not_ready | worth_testing | ready_for_meeting

FORMAT DE SORTIE OBLIGATOIRE
Retourne uniquement un JSON valide avec cette structure :

{
"results": [
{
"row_index": 0,
"lead_score": 0,
"priority": "GO",
"fit_reason": "string",
"why_now": "string",
"probable_business_pains": "string",
"detected_opportunities": "string",
"best_outreach_channel": "Email",
"channel_reason": "string",
"email_idea": "string",
"linkedin_idea": "string",
"call_opener": "string",
"next_best_action": "envoyer un email personnalisé",
"effort_level": "low",
"confidence_level": "high",
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
"demo_angle": "string",
"handoff_note": "string"
}
]
}

IMPORTANT
- row_index doit reprendre exactement __row_index
- questions_to_ask doit contenir 2 à 4 questions
- results doit contenir EXACTEMENT ${csvData.length} objets

LEADS À ANALYSER
${JSON.stringify(csvData, null, 2)}
`;

const response = await client.chat.completions.create({
model: "gpt-4.1-mini",
messages: [
{
role: "system",
content:
"Tu réponds uniquement avec un objet JSON valide. Aucun texte hors JSON.",
},
{
role: "user",
content: prompt,
},
],
temperature: 0.1,
response_format: { type: "json_object" },
});

const text = response.choices[0]?.message?.content?.trim();

if (!text) {
return NextResponse.json(
{ error: "Réponse IA vide." },
{ status: 500 }
);
}

let parsed: any;
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

const sortedResults = [...parsed.results].sort(
(a, b) => Number(a.row_index) - Number(b.row_index)
);

return NextResponse.json({ results: sortedResults });
} catch (error: any) {
console.error("analyze-csv error:", error);

return NextResponse.json(
{
error:
error?.message ||
error?.error?.message ||
error?.response?.data ||
"Impossible d’analyser le CSV.",
},
{ status: 500 }
);
}
}
