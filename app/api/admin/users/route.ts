import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { adminDb, isAdminEnabled } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface ProfileRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  approved: boolean;
  createdAt: number;
  company?: string;
  role?: string;
  teamSize?: string;
  source?: string;
}

async function sendApprovalEmail(email: string, displayName: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // optionnel — pas d'erreur si non configuré

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://revora.app";
  const name = displayName ?? email;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "REVORA <onboarding@resend.dev>",
      to: email,
      subject: "Ton accès REVORA est activé 🎉",
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:48px 24px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <!-- Header -->
        <tr><td style="padding-bottom:32px">
          <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#f8fafc">REVORA</span>
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#64748b;margin-left:8px">v2</span>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px">
          <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#7c3aed;font-weight:600">Accès activé</p>
          <h1 style="margin:0 0 20px;font-size:28px;font-weight:800;color:#f8fafc;line-height:1.2">
            Bienvenue, ${name} 👋
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.7">
            Ton compte REVORA vient d'être validé par un administrateur.<br>
            Tu peux maintenant accéder à ta plateforme, uploader tes CSV et scorer tes premiers leads.
          </p>
          <a href="${appUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#0d9488);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.3px">
            Accéder à REVORA →
          </a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:28px">
          <p style="margin:0;font-size:12px;color:#475569;line-height:1.6">
            Tu reçois cet email car tu as créé un compte sur REVORA.<br>
            Si tu n'es pas à l'origine de cette demande, ignore cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }),
  }).catch(() => {
    // L'email est best-effort — on ne fait pas échouer l'approbation si Resend est down.
  });
}

/** Liste tous les profils utilisateurs (admin only). */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  if (!isAdminEnabled || !adminDb) {
    return NextResponse.json(
      { error: "Firebase Admin non configuré côté serveur." },
      { status: 503 }
    );
  }

  try {
    const snap = await adminDb.collection("users").get();
    const users: ProfileRow[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        approved: Boolean(data.approved),
        createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
        company: data.company ?? undefined,
        role: data.role ?? undefined,
        teamSize: data.teamSize ?? undefined,
        source: data.source ?? undefined,
      };
    });
    users.sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Approuve / refuse un compte (admin only). Body: { uid, approved }. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  if (!isAdminEnabled || !adminDb) {
    return NextResponse.json(
      { error: "Firebase Admin non configuré côté serveur." },
      { status: 503 }
    );
  }

  let body: { uid?: string; approved?: boolean };
  try {
    body = (await req.json()) as { uid?: string; approved?: boolean };
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  if (!body.uid || typeof body.approved !== "boolean") {
    return NextResponse.json(
      { error: "uid et approved (boolean) requis." },
      { status: 400 }
    );
  }

  try {
    const ref = adminDb.collection("users").doc(body.uid);
    await ref.set({ approved: body.approved }, { merge: true });

    // Envoie l'email de bienvenue uniquement lors de l'approbation.
    if (body.approved) {
      const snap = await ref.get();
      const data = snap.data();
      if (data?.email) {
        await sendApprovalEmail(data.email as string, data.displayName as string | null);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
