import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
{ error: "MAMMOUTH_API_KEY introuvable côté serveur." },
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

MISSION
Tu aides une équipe sales à transformer un CSV de leads en décisions commerciales actionnables.

OBJECTIF
Pour chaque lead, tu dois aider à répondre à 6 questions :
1. Ce lead mérite-t-il du temps commercial ?
2. Pourquoi lui plutôt qu’un autre ?
3. Pourquoi maintenant ou pas maintenant ?
4. Quel angle commercial est le plus crédible ?
5. Quel canal est le plus rentable ?
6. Quelle action concrète faut-il lancer ensuite ?

RÈGLE ABSOLUE
- Ne jamais inventer une donnée absente
- Ne jamais transformer une hypothèse en fait
- Respecter strictement le brief client
- Privilégier la qualité de décision commerciale à la quantité de texte
- Rester crédible, utile et orienté action

ENTRÉES

BRIEF CLIENT
- offer_description : ${brief.offerDescription}
- problem_solved : ${brief.problemSolved}
- target_company_types : ${brief.targetCompanyTypes}
- target_roles : ${brief.targetRoles}

PROFIL D’ANALYSE ENRICHI
- productSummary : ${generatedProfile.productSummary}
- problemSummary : ${generatedProfile.problemSummary}
- valueProposition : ${generatedProfile.valueProposition}
- icpSummary : ${generatedProfile.icpSummary}
- targetFunctions : ${generatedProfile.targetFunctions.join(", ")}
- buyingSignals : ${generatedProfile.buyingSignals.join(", ")}
- businessPains : ${generatedProfile.businessPains.join(", ")}
- recommendedAngles : ${generatedProfile.recommendedAngles.join(", ")}
- priorityLogic : ${generatedProfile.priorityLogic}

LOGIQUE D’ANALYSE
Tu dois analyser chaque lead selon 5 axes :

1. FIT ICP /25
Évalue :
- cohérence avec la cible donnée
- cohérence avec le secteur si visible
- cohérence avec le type d’entreprise ciblé
- cohérence avec le brief client

2. ROLE RELEVANCE /20
Évalue :
- pertinence du poste ou rôle
- proximité avec la décision ou l’usage
- compatibilité avec les profils visés

3. DATA QUALITY /15
Évalue :
- qualité des données disponibles
- présence d’un canal exploitable
- lisibilité minimale du lead

4. NEED RELEVANCE /20
Évalue :
- plausibilité que le problème résolu existe chez ce lead
- crédibilité de la douleur business
- légitimité de l’angle commercial

5. ACTIONABILITY /20
Évalue :
- capacité à agir rapidement
- capacité à formuler une approche crédible
- rentabilité probable de l’effort outbound

SCORE FINAL
Le score final = somme des 5 sous-scores.
Le score final est sur 100.

PRIORITÉS
GO
- score généralement élevé
- fit crédible
- canal exploitable
- angle défendable
- effort rentable

MAYBE
- potentiel réel mais incomplet
- données partielles
- besoin plausible mais pas assez clair
- mérite un test léger ou un enrichissement

SKIP
- faible fit
- besoin peu crédible
- rôle trop éloigné
- données trop faibles
- effort peu rentable

RÈGLES DE VETO
Un lead ne peut pas être GO si :
- aucun canal exploitable n’est disponible
- le rôle est manifestement hors cible
- les données sont trop faibles pour agir
- le fit avec la cible est trop faible

CONFIANCE
confidence_level :
- high = données suffisantes + fit lisible + angle crédible
- medium = logique plausible mais incomplète
- low = analyse fragile, trop d’hypothèses ou données faibles

PROFONDEUR D’ANALYSE
analysis_depth :
- basic = score + décision + action simple
- advanced = analyse plus poussée avec why_now, pains, opportunities et exécution commerciale

RÈGLES DE SORTIE
- Réponses courtes
- Pas de paragraphes longs
- fit_reason = 1 phrase
- why_now = 1 phrase
- channel_reason = 1 phrase
- probable_business_pains = 1 à 2 points maximum
- detected_opportunities = 1 à 2 points maximum
- email_idea = court
- linkedin_idea = court
- call_opener = 1 phrase
- objection_handling = court
- discovery_focus = 1 phrase
- value_hypothesis = 1 phrase
- handoff_note = court

CANAUX AUTORISÉS
best_outreach_channel :
- Email
- LinkedIn
- Call
- Multicanal
- Enrichissement d'abord
- Nurture léger

LOGIQUE CANAL
- Email si email dispo + angle crédible
- LinkedIn si email faible/absent mais contact identifiable
- Call si téléphone dispo + priorité forte + angle simple
- Multicanal si lead fort + plusieurs canaux
- Enrichissement d'abord si lead potentiellement intéressant mais trop faible en données
- Nurture léger si pas absurde mais pas assez fort pour un effort immédiat

ACTIONS AUTORISÉES
next_best_action :
- envoyer un email personnalisé
- tenter un message LinkedIn
- appeler directement
- lancer une séquence multicanale
- enrichir avant contact
- garder en watchlist
- sortir du pipe court terme

OBJECTIONS
probable_objection doit être réaliste et liée au contexte probable :
- pas prioritaire maintenant
- déjà un outil ou un process
- pas la bonne personne
- trop tôt
- pas assez de volume
- besoin peu clair

objection_handling doit être :
- courte
- crédible
- calme
- non agressive
- ouverte

COUCHE HYBRIDE BIZDEV / AE
Ajoute aussi :
- opportunity_level : low | medium | high
- deal_potential : low | medium | high
- pain_clarity : low | medium | high
- urgency_level : low | medium | high
- sales_readiness : not_ready | worth_testing | ready_for_meeting
- discovery_focus : 1 phrase
- questions_to_ask : 2 à 4 questions courtes
- value_hypothesis : 1 phrase
- handoff_note : résumé court utile pour AE / ingénieur commercial

RÈGLE CRITIQUE
Tu dois analyser TOUTES les lignes fournies.
Il doit y avoir exactement 1 résultat par lead, dans le même ordre.

FORMAT DE SORTIE OBLIGATOIRE
Retourne uniquement un JSON valide avec cette structure :

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

VÉRIFICATION FINALE
Avant de répondre, vérifie :
- que le score est cohérent avec les sous-scores
- que la priorité est cohérente avec le score ET les règles de veto
- que les douleurs restent plausibles
- que le canal est logique
- que la next best action est concrète
- que la confiance est honnête
- qu’aucune donnée absente n’est inventée
- que la sortie est bien du JSON valide uniquement

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
});

const text = response.choices?.[0]?.message?.content?.trim();

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
} catch (error: any) {
console.error("analyze-csv error:", error);

return NextResponse.json(
{
error:
error?.message ||
error?.error?.message ||
error?.response?.data ||
JSON.stringify(error) ||
"Impossible d’analyser le CSV.",
},
{ status: 500 }
);
}
}
