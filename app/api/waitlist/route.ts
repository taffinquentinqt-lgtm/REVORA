import { NextRequest, NextResponse } from "next/server";
import { adminDb, isAdminEnabled } from "@/lib/firebase-admin";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Envoi Resend, best-effort : ne lève jamais (les mails ne bloquent pas la capture). */
async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  replyTo?: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "REVORA <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(replyTo ? { reply_to: replyTo } : {}),
      html,
    }),
  }).catch(() => {});
}

/** Mail (A) — notification interne admin. */
function adminHtml(email: string, source: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:48px 24px"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
      <tr><td style="padding-bottom:32px">
        <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#f8fafc">REVORA</span>
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#64748b;margin-left:8px">admin</span>
      </td></tr>
      <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px">
        <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#7c3aed;font-weight:600">Nouveau contact waitlist</p>
        <h1 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#f8fafc">${email}</h1>
        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:8px">
          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b;width:120px">Email</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#f8fafc">${email}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b">Source</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#f8fafc">${source}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#64748b">Date</td><td style="padding:8px 0;font-size:13px;color:#f8fafc">${new Date().toLocaleString("fr-FR")}</td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Mail (B) — confirmation au visiteur. */
function welcomeHtml() {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:48px 24px"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
      <tr><td style="padding-bottom:32px">
        <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#f8fafc">REVORA</span>
      </td></tr>
      <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px">
        <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#0d9488;font-weight:600">C'est noté</p>
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#f8fafc">Merci — on revient vers toi.</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1">
          Tu es bien dans la boucle REVORA. On t'enverra un <strong style="color:#f8fafc">cas concret d'analyse</strong> et les nouveautés produit — rien d'autre, zéro spam.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#cbd5e1">
          Envie de tester tout de suite ? Tu as <strong style="color:#f8fafc">14 jours gratuits</strong>, sans carte.
        </p>
        <a href="${SITE_URL}/login" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#0d9488);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700">
          Tester REVORA gratuitement →
        </a>
        <p style="margin:28px 0 0;font-size:12px;color:#64748b">
          Tu reçois cet email car tu as laissé ton adresse sur revora-sales.vercel.app. Réponds à ce message pour te désinscrire.
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Capture d'email publique (landing). Stocke dans Firestore `waitlist` + notifie. */
export async function POST(req: NextRequest) {
  let body: { email?: string; source?: string };
  try {
    body = (await req.json()) as { email?: string; source?: string };
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  const source =
    typeof body.source === "string" ? body.source.slice(0, 60) : "landing";

  // Persistance Firestore (best-effort, ne bloque pas l'utilisateur).
  if (isAdminEnabled && adminDb) {
    try {
      const id = email.replace(/[^a-z0-9@._-]/g, "_");
      await adminDb
        .collection("waitlist")
        .doc(id)
        .set({ email, source, createdAt: Date.now() }, { merge: true });
    } catch {
      // on continue : les mails partent quand même
    }
  }

  // (A) Notif admin + (B) confirmation visiteur — best-effort.
  const admins = (process.env.NEXT_PUBLIC_REVORA_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (admins.length > 0) {
    await sendEmail(admins, `Nouveau contact waitlist — ${email}`, adminHtml(email, source));
  }
  await sendEmail(email, "Bienvenue chez REVORA 👋", welcomeHtml(), admins[0]);

  return NextResponse.json({ ok: true });
}
