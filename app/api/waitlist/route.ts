import { NextRequest, NextResponse } from "next/server";
import { adminDb, isAdminEnabled } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Capture d'email publique (landing). Stocke dans Firestore `waitlist`. */
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

  // Sans Firebase Admin (dev/local), on accepte sans persister.
  if (!isAdminEnabled || !adminDb) {
    return NextResponse.json({ ok: true });
  }

  try {
    // Doc id dérivé de l'email pour dédoublonner (caractères Firestore-safe).
    const id = email.replace(/[^a-z0-9@._-]/g, "_");
    await adminDb
      .collection("waitlist")
      .doc(id)
      .set(
        {
          email,
          source:
            typeof body.source === "string" ? body.source.slice(0, 60) : "landing",
          createdAt: Date.now(),
        },
        { merge: true }
      );
    return NextResponse.json({ ok: true });
  } catch {
    // On ne bloque jamais l'utilisateur sur une erreur de persistance.
    return NextResponse.json({ ok: true });
  }
}
