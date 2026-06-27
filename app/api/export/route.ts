import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import type { Analysis, ScoredLead } from "@/lib/types";

export const runtime = "nodejs";

/**
 * NOTE: spec demande SheetJS, mais le build communautaire de `xlsx` n'applique
 * ni remplissage, ni gras, ni texte barré (feature Pro). `exceljs` — déjà dans
 * les dépendances — produit la mise en forme conditionnelle exigée.
 */

// Fills pré-mélangés sur fond blanc (opacités demandées par le spec)
const FILLS: Record<string, string> = {
  GO: "FFCCF6EE", // #00D4AA @ 20%
  MAYBE: "FFFDEDD3", // #F5A623 @ 20%
  SKIP: "FFFFDBE2", // #FF4D6D @ 20%
  VETO: "FFEBA9AF", // #CC2936 @ 40%
};

function kindOf(item: ScoredLead): "GO" | "MAYBE" | "SKIP" | "VETO" | null {
  if (!item.score) return null;
  if (item.score.veto) return "VETO";
  return item.score.priority;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;

  let analysis: Analysis;
  try {
    const body = (await req.json()) as { analysis?: Analysis };
    if (!body.analysis) throw new Error("missing");
    analysis = body.analysis;
  } catch {
    return NextResponse.json({ error: "Analyse invalide." }, { status: 400 });
  }

  try {
    // Union de toutes les colonnes brutes rencontrées
    const rawKeys: string[] = [];
    for (const { lead } of analysis.results) {
      for (const k of Object.keys(lead.raw)) {
        if (!rawKeys.includes(k)) rawKeys.push(k);
      }
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Leads");

    const aiCols = [
      "Score",
      "Priority",
      "Veto",
      "Briefing",
      "Ouverture",
      "Canal",
      "Timing",
      "Objections",
      "Piège",
    ];
    const headers = [...rawKeys, ...aiCols];

    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6F0" },
      };
    });

    for (const item of analysis.results) {
      const s = item.score;
      const objections = s
        ? s.objections
            .map((o) => `• ${o.objection} → ${o.reponse}`)
            .join("\n")
        : "";
      const rowValues = [
        ...rawKeys.map((k) => item.lead.raw[k] ?? ""),
        s ? s.score : "",
        s ? (s.veto ? "VETO" : s.priority) : "ERREUR",
        s ? (s.veto ? `OUI — ${s.veto_reason ?? ""}` : "Non") : "",
        s?.briefing ?? "",
        s?.ouverture ?? "",
        s?.recommended_channel ?? "",
        s?.timing ?? "",
        objections,
        s?.piege ?? "",
      ];
      const row = ws.addRow(rowValues);

      const kind = kindOf(item);
      if (kind) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: FILLS[kind] },
          };
          if (kind === "VETO") cell.font = { strike: true };
        });
      }
    }

    // Largeurs raisonnables
    ws.columns.forEach((col) => {
      col.width = 22;
      col.alignment = { vertical: "top", wrapText: true };
    });

    const buffer = await wb.xlsx.writeBuffer();
    const date = new Date(analysis.createdAt).toISOString().slice(0, 10);
    const filename = `REVORA_${analysis.name.replace(/\s+/g, "-")}_${date}.xlsx`;

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export impossible";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
