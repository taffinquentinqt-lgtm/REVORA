import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, isAdminEnabled } from "./firebase-admin";

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

export interface AuthedUser {
  uid: string;
  email: string | null;
}

/** Allowlist admin (même variable que côté client). */
export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  const list = (process.env.NEXT_PUBLIC_REVORA_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/**
 * Vérifie le token d'auth d'une requête API.
 *   • Firebase Admin configuré  -> vérifie un vrai ID token Firebase (sécurisé)
 *   • sinon (mode dev local)     -> accepte le token de session locale "local.<b64>"
 *
 * En prod, configure les variables FIREBASE_* (service account) pour que la
 * vérification soit cryptographique. Sans elles, seul le mode local est accepté.
 */
async function verifyToken(authHeader: string | null): Promise<AuthedUser | null> {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  if (isAdminEnabled && adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email ?? null };
    } catch {
      return null;
    }
  }

  // Mode local : token = "local.<base64(json user)>"
  if (token.startsWith("local.")) {
    try {
      const json = Buffer.from(token.slice(6), "base64").toString("utf8");
      const u = JSON.parse(json) as { uid?: string; email?: string };
      if (u?.uid) return { uid: u.uid, email: u.email ?? null };
    } catch {
      return null;
    }
  }
  return null;
}

/* ───────────────────────── Rate limit (en mémoire) ─────────────────────── */
/**
 * Limiteur simple par utilisateur. NOTE : en mémoire = par instance serverless.
 * Pour une vraie limite distribuée en prod, utiliser un store partagé
 * (Upstash Redis, etc.).
 *
 * Dimensionnement : l'analyse envoie des batches de 5 leads. Un fichier plein
 * (200 leads max) = 40 requêtes. 120 req/min laisse de la marge pour un upload
 * complet + les retries + une 2ᵉ analyse dans la même minute, sans casser.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const hits = new Map<string, number[]>();

function rateLimited(uid: string): boolean {
  const now = Date.now();
  const arr = (hits.get(uid) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(uid, arr);
  return arr.length > MAX_REQUESTS;
}

/**
 * À appeler en tête de chaque route protégée.
 * Retourne soit l'utilisateur, soit une réponse d'erreur prête à renvoyer.
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: AuthedUser } | { response: NextResponse }> {
  const user = await verifyToken(req.headers.get("authorization"));
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Non authentifié. Connecte-toi pour continuer." },
        { status: 401 }
      ),
    };
  }
  if (rateLimited(user.uid)) {
    return {
      response: NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans un instant." },
        { status: 429 }
      ),
    };
  }
  return { user };
}

/**
 * Comme requireAuth, mais exige aussi un accès actif :
 *   • admin                       -> toujours OK
 *   • approved + abonné           -> OK
 *   • approved + essai non expiré -> OK
 *   • sinon                       -> 403 (non validé) ou 402 (essai terminé)
 * Repli : si Firestore Admin indisponible (dev/local), on laisse passer.
 */
export async function requireActiveAccess(
  req: NextRequest
): Promise<{ user: AuthedUser } | { response: NextResponse }> {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth;

  if (isAdminEmail(auth.user.email)) return auth;
  if (!isAdminEnabled || !adminDb) return auth; // pas de vérif possible -> dev

  try {
    const snap = await adminDb.collection("users").doc(auth.user.uid).get();
    const p = snap.data();

    if (!p?.approved) {
      return {
        response: NextResponse.json(
          { error: "Compte en attente de validation." },
          { status: 403 }
        ),
      };
    }

    if (!p.subscriptionActive) {
      const start =
        typeof p.trialStartedAt === "number"
          ? p.trialStartedAt
          : typeof p.createdAt === "number"
          ? p.createdAt
          : Date.now();
      if (Date.now() > start + TRIAL_MS) {
        return {
          response: NextResponse.json(
            {
              error:
                "Ton essai gratuit est terminé. Contacte l'administrateur pour activer ton abonnement.",
            },
            { status: 402 }
          ),
        };
      }
    }

    return auth;
  } catch {
    return auth; // fail-open en cas d'erreur Firestore
  }
}

/** Comme requireAuth, mais exige aussi que l'utilisateur soit admin. */
export async function requireAdmin(
  req: NextRequest
): Promise<{ user: AuthedUser } | { response: NextResponse }> {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth;
  if (!isAdminEmail(auth.user.email)) {
    return {
      response: NextResponse.json(
        { error: "Accès réservé aux administrateurs." },
        { status: 403 }
      ),
    };
  }
  return auth;
}
