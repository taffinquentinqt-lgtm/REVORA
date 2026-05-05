import OpenAI from "openai";
import { NextResponse } from "next/server";

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
if (!process.env.OPENAI_API_KEY) {
return NextResponse.json(
{ error: "OPENAI_API_KEY introuvable côté serveur." },
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

let parsed: GeneratedProfile;
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
} catch (error: unknown) {
console.error("generate-profile error:", error);

return NextResponse.json(
{
error:
error instanceof Error
? error.message
: "Impossible de générer le profil d’analyse avec OpenAI.",
},
{ status: 500 }
);
}
}
