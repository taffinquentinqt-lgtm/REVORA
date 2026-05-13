import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.MAMMOUTH_API_KEY!,
  baseURL: "https://api.mammouth.ai/v1",
});

const BATCH_SIZE = 20;
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildPrompt(brief: any, profile: any, chunk: any[]) {
  return `
IMPORTANT:
JSON uniquement. Pas de texte.

ROLE:
SDR expert B2B orienté closing.

OBJECTIF:
Prioriser et générer des actions de closing concrètes.

SCORING (100):
- fit_icp_score /25
- role_relevance_score /20
- data_quality_score /15
- need_relevance_score /20
- actionability_score /20

DIMENSIONS:
- opportunity_level: low | medium | high
- pain_clarity: low | medium | high
- urgency_level: low | medium | high
- sales_readiness: not_ready | worth_testing | ready_for_meeting

CLOSING LOGIC:

TAG:
- HOT = prêt maintenant (GO + urgency high + pain clair)
- WARM = potentiel mais timing moyen
- COLD = faible intérêt

ANGLE:
- spécifique au lead

HOOK:
- court et engageant

EMAIL:
- court, direct, 1 CTA

LINKEDIN:
- naturel, pas commercial

CALL:
- punchy <10 secondes

OBJECTION:
- réaliste + réponse crédible

NEXT ACTION:
- action concrète

BRIEF:
${JSON.stringify(brief)}

PROFIL:
${JSON.stringify(profile)}

LEADS:
${JSON.stringify(chunk)}

FORMAT:
{
  "results": [
    {
      "row_index": number,
      "lead_score": number,
      "priority": "GO" | "MAYBE" | "SKIP",

      "fit_icp_score": number,
      "role_relevance_score": number,
      "data_quality_score": number,
      "need_relevance_score": number,
      "actionability_score": number,

      "opportunity_level": "low" | "medium" | "high",
      "pain_clarity": "low" | "medium" | "high",
      "urgency_level": "low" | "medium" | "high",
      "sales_readiness": "not_ready" | "worth_testing" | "ready_for_meeting",

      "tag": "HOT" | "WARM" | "COLD",

      "angle": string,
      "hook": string,

      "email_subject": string,
      "email_body": string,

      "linkedin_message": string,
      "call_opening": string,

      "objection_guess": string,
      "objection_answer": string,

      "next_best_action": string
    }
  ]
}
`;
}

async function callAI(prompt: string) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.responses.create({
        model: "gpt-4o-mini", // ✅ Mammouth compatible
        input: prompt,
      });

      const text = response.output_text?.trim() || "";
      const parsed = JSON.parse(text);

      if (!parsed.results || !Array.isArray(parsed.results)) {
        throw new Error("Format invalide");
      }

      return parsed.results;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
}

function normalize(result: any) {
  return {
    row_index: result.row_index ?? 0,
    lead_score: Math.min(100, Math.max(0, result.lead_score ?? 0)),

    priority: ["GO", "MAYBE", "SKIP"].includes(result.priority)
      ? result.priority
      : "MAYBE",

    fit_icp_score: result.fit_icp_score ?? 0,
    role_relevance_score: result.role_relevance_score ?? 0,
    data_quality_score: result.data_quality_score ?? 0,
    need_relevance_score: result.need_relevance_score ?? 0,
    actionability_score: result.actionability_score ?? 0,

    opportunity_level: ["low", "medium", "high"].includes(result.opportunity_level)
      ? result.opportunity_level
      : "low",

    pain_clarity: ["low", "medium", "high"].includes(result.pain_clarity)
      ? result.pain_clarity
      : "low",

    urgency_level: ["low", "medium", "high"].includes(result.urgency_level)
      ? result.urgency_level
      : "low",

    sales_readiness: [
      "not_ready",
      "worth_testing",
      "ready_for_meeting",
    ].includes(result.sales_readiness)
      ? result.sales_readiness
      : "not_ready",

    tag: ["HOT", "WARM", "COLD"].includes(result.tag)
      ? result.tag
      : "COLD",

    angle: result.angle ?? "",
    hook: result.hook ?? "",

    email_subject: result.email_subject ?? "",
    email_body: result.email_body ?? "",

    linkedin_message: result.linkedin_message ?? "",
    call_opening: result.call_opening ?? "",

    objection_guess: result.objection_guess ?? "",
    objection_answer: result.objection_answer ?? "",

    next_best_action: result.next_best_action ?? "",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { leads, brief, generatedProfile } = await req.json();

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "Leads invalides" }, { status: 400 });
    }

    const batches = [];
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      batches.push(leads.slice(i, i + BATCH_SIZE));
    }

    const allResults = [];

    for (const chunk of batches) {
      const prompt = buildPrompt(brief, generatedProfile, chunk);
      const results = await callAI(prompt);
      const clean = results.map(normalize);
      allResults.push(...clean);
    }

    const sorted = allResults.sort((a, b) => b.lead_score - a.lead_score);

    return NextResponse.json({
      success: true,
      count: sorted.length,
      results: sorted,
    });

  } catch (error: unknown) {
    console.error("ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur",
      },
      { status: 500 }
    );
  }
}
