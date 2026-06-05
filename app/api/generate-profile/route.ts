import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({
apiKey: process.env.GROQ_API_KEY,
baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
try {
if (!process.env.GROQ_API_KEY) {
return NextResponse.json(
{ error: "GROQ_API_KEY introuvable côté serveur." },
{ status: 500 }
);
}

const body = await req.json();
const {
offerDescription,
problemSolved,
targetCompanyTypes,
targetRoles,
} = body;

if (
!offerDescription?.trim() ||
!problemSolved?.trim() ||
!targetCompanyTypes?.trim() ||
!targetRoles?.trim()
) {
return NextResponse.json(
{ error: "Tous les champs sont requis." },
{ status: 400 }
);
}

const prompt = `
Tu es SalesPilote, l’agent IA d’analyse commerciale de REVORA.

Analyse ces informations :

OFFRE
${offerDescription}

PROBLÈME RÉSOLU
${problemSolved}

TYPE D’ENTREPRISE CIBLÉ
${targetCompanyTypes}

PROFILS À CONTACTER
${targetRoles}

Retourne uniquement un JSON valide, sans texte avant ni après.

Format obligatoire :
{
"productSummary": "string",
"problemSummary": "string",
"valueProposition": "string",
"icpSummary": "string",
"targetFunctions": ["string"],
"buyingSignals": ["string"],
"businessPains": ["string"],
"recommendedAngles": ["string"],
"priorityLogic": "string"
}
`;

const response = await client.chat.completions.create({
model: "llama-3.3-70b-versatile",
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
temperature: 0.2,
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

return NextResponse.json(parsed);
} catch (error: any) {
console.error("generate-profile error:", error);

return NextResponse.json(
{
error:
error?.message ||
error?.error?.message ||
error?.response?.data ||
JSON.stringify(error) ||
"Impossible de générer le profil d’analyse.",
},
{ status: 500 }
);
}
}