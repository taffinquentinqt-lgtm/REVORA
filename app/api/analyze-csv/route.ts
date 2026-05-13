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
        row_index: rowIndex,
      };

      headers.forEach((header, index) => {
        obj[header] = row[index] ?? "";
      });

      return obj;
    });

    const prompt = `
Tu es un expert en qualification de leads B2B.

CONTEXTE
offer: ${brief.offerDescription}
problem: ${brief.problemSolved}
target_companies: ${brief.targetCompanyTypes}
target_roles: ${brief.targetRoles}

ICP (référence)
${generatedProfile.icpSummary}

OBJECTIF
Analyser chaque lead et décider s’il faut investir du temps commercial.

SCORING (TOTAL /100)
- fit ICP /25
- maturité /20
- signaux d’achat /20
- pertinence besoin /20
- actionnabilité /15

FORMAT JSON STRICT :
{
  "results": [
    {
      "row_index": number,
      "lead_score": number,
      "priority": "GO|MAYBE|SKIP",

      "fit_reason": string,
      "why_now": string,

      "probable_business_pains": string[],
      "detected_opportunities": string[],

      "best_outreach_channel": "Email|LinkedIn|Call|Multicanal|Enrichissement|Nurture",
      "channel_reason": string,

      "email_idea": string,
      "linkedin_idea": string,
      "call_opener": string,

      "next_best_action": string,

      "effort_level": "low|medium|high|no effort",
      "confidence_level": "high|medium|low",

      "probable_objection": string,
      "objection_handling": string
    }
  ]
}

RÈGLES :
- EXACTEMENT 1 résultat par lead
- UTILISER row_index fourni
- PAS d'invention de données absentes
- PAS de texte hors JSON
- ANALYSE critique et réaliste (pas optimiste)

LEADS :
${JSON.stringify(csvData, null, 2)}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      temperature: 0.1,
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
    });

    let text = response.choices?.[0]?.message?.content?.trim() || "";

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

    if (!parsed || !Array.isArray(parsed.results)) {
      return NextResponse.json(
        {
          error: "Format IA invalide : results manquant ou invalide.",
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

        effort_level: item.effort_level || "medium",
        confidence_level: item.confidence_level || "medium",

        probable_objection: item.probable_objection || "",
        objection_handling: item.objection_handling || "",
      }));

    return NextResponse.json({
      results: normalizedResults,
    });
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
