import { gateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import { NextResponse } from "next/server";

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
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
return NextResponse.json(
{ error: "GOOGLE_GENERATIVE_AI_API_KEY introuvable côté serveur." },
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

const { text } = await generateText({
model: gateway("google/gemini-2.0-flash"),
prompt: `Tu es SalesPilote. Tu réponds uniquement avec un objet JSON valide. Aucun texte hors JSON.\n\n${prompt}`,
});

if (!text?.trim()) {
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
: "Impossible de générer le profil d’analyse avec Gemini.",
},
{ status: 500 }
);
}
}
