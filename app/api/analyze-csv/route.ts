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

type Brief = {
  offerDescription: string;
  problemSolved: string;
  targetCompanyTypes: string;
  targetRoles: string;
  averageDealSize?: string;
  averageSalesCycle?: string;
  uniqueDifferentiator?: string;
  commonObjections?: string;
  mainCompetitors?: string;
  alreadyContacted?: string;
  inPipeline?: string;
  blacklisted?: string;
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
      brief: Brief;
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
        { error: "Données incomplètes pour l'analyse CSV." },
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
Tu es un Revenue Intelligence System de niveau enterprise.
Tu analyses un portefeuille de leads B2B et produis un plan 
d'action commercial chirurgical et immédiatement exploitable.
Tu ne produis QUE du JSON valide. Zéro texte avant ou après.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTE COMMERCIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OFFRE                 : ${brief.offerDescription}
PROBLÈME RÉSOLU       : ${brief.problemSolved}
CIBLES ENTREPRISES    : ${brief.targetCompanyTypes}
CIBLES PERSONAS       : ${brief.targetRoles}
DEAL SIZE MOYEN       : ${brief.averageDealSize ?? "Non renseigné"}
CYCLE DE VENTE        : ${brief.averageSalesCycle ?? "Non renseigné"}
DIFFÉRENCIATEUR CLÉ   : ${brief.uniqueDifferentiator ?? "Non renseigné"}
OBJECTIONS RÉCURRENTES: ${brief.commonObjections ?? "Non renseigné"}
COMPÉTITEURS          : ${brief.mainCompetitors ?? "Non renseigné"}
DÉJÀ CONTACTÉS        : ${brief.alreadyContacted ?? "Non renseigné"}
EN PIPELINE ACTIF     : ${brief.inPipeline ?? "Non renseigné"}
BLACKLISTÉS           : ${brief.blacklisted ?? "Non renseigné"}

ICP DE RÉFÉRENCE
${generatedProfile.icpSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIQUE DE SCORING — TOTAL /100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[FIT ICP — /25]
Secteur exact, taille entreprise, persona ciblé,
maturité marché, adéquation géographique.
Pénalité si secteur hors cible ou taille incompatible.

[SIGNAUX D'ACHAT — /25]
Levée de fonds récente, recrutement en cours,
nouveau décideur arrivé, expansion géographique,
stack technologique compatible, contenu consommé,
événement déclencheur identifiable.
Bonus si signal daté de moins de 30 jours.

[POTENTIEL REVENU — /20]
Deal size estimé basé sur taille entreprise + secteur + persona.
Pondéré par probabilité de conversion estimée.
Score élevé si fort potentiel ET conversion probable.

[ACTIONNABILITÉ — /20]
Décideur ou champion identifié, canal accessible,
données de contact disponibles, timing favorable.
Pénalité si données critiques absentes.

[EFFORT vs RETOUR — /10]
Ratio entre effort d'approche estimé et retour potentiel.
Score élevé = fort retour, faible effort.
Score bas = données manquantes, accès difficile, cycle long.

RÈGLE DE PRIORITÉ FINALE :
TRAITER_NOW  → Score ≥ 80 ET actionnabilité ≥ 15
ENRICHIR     → Score ≥ 75 ET données critiques manquantes
SEQUENCER    → Score 55–79
NURTURE      → Score 35–54 OU déjà contacté récemment
SKIP         → Score < 35 OU blacklisté OU hors ICP total

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT JSON ATTENDU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "war_room": {
    "date_analyse": "ISO8601",
    "total_leads_analyses": number,
    "dispatch": {
      "traiter_now": number,
      "enrichir": number,
      "sequencer": number,
      "nurture": number,
      "skip": number
    },
    "top_3_opportunites": [...],
    "alertes": [...],
    "lecture_portefeuille": {
      "secteur_dominant": string,
      "persona_dominant": string,
      "signal_marche_detecte": string,
      "recommandation_strategique": string,
      "point_attention_manager": string
    }
  },
  "leads": [...],
  "comptes_multi_contacts": [...],
  "file_attente": [...]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES NON NÉGOCIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ leads[] trié par priorite_rank croissant
→ TRAITER_NOW en premier, SKIP en dernier
→ Doublons compte → comptes_multi_contacts obligatoire
→ Blacklisté → SKIP sans analyse
→ Déjà contacté → NURTURE avec trigger de réactivation
→ Zéro hallucination — donnée absente = manquant_critique
→ Zéro texte hors JSON — JSON valide et parseable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEADS À ANALYSER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

    const text = response.choices?.[0]?.message?.content?.trim() || "";

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
        { error: "La réponse IA n'est pas un JSON valide.", raw: text },
        { status: 500 }
      );
    }

    // Nouveau format : on retourne directement le parsed (war_room + leads)
    if (!parsed || !parsed.war_room || !Array.isArray(parsed.leads)) {
      return NextResponse.json(
        {
          error: "Format IA invalide : war_room ou leads manquant.",
          raw: parsed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("analyze-csv error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          error?.error?.message ||
          error?.response?.data ||
          JSON.stringify(error) ||
          "Impossible d'analyser le CSV.",
      },
      { status: 500 }
    );
  }
}
