import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";

export const runtime = "nodejs";

interface SignupPayload {
  displayName?: string;
  email?: string;
  company?: string;
  role?: string;
  teamSize?: string;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: true }); // optionnel

  let body: SignupPayload;
  try {
    body = (await req.json()) as SignupPayload;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const admins = (process.env.NEXT_PUBLIC_REVORA_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (admins.length === 0) return NextResponse.json({ ok: true });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "REVORA <onboarding@resend.dev>",
      to: admins,
      subject: `Nouvelle inscription — ${body.displayName ?? body.email ?? "Inconnu"}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:48px 24px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr><td style="padding-bottom:32px">
          <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#f8fafc">REVORA</span>
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#64748b;margin-left:8px">admin</span>
        </td></tr>
        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px">
          <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#7c3aed;font-weight:600">Nouvelle inscription</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#f8fafc">
            ${body.displayName ?? body.email ?? "Nouvel utilisateur"} demande l'accès
          </h1>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px">
            ${body.email ? `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b;width:120px">Email</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#f8fafc">${body.email}</td></tr>` : ""}
            ${body.company ? `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b">Entreprise</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#f8fafc">${body.company}</td></tr>` : ""}
            ${body.role ? `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b">Poste</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#f8fafc">${body.role}</td></tr>` : ""}
            ${body.teamSize ? `<tr><td style="padding:8px 0;font-size:13px;color:#64748b">Équipe</td><td style="padding:8px 0;font-size:13px;color:#f8fafc">${body.teamSize} personne(s)</td></tr>` : ""}
          </table>
          <a href="${appUrl}/admin" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#0d9488);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700">
            Valider l'accès →
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
