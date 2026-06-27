import "server-only";

import {
  initializeApp,
  getApps,
  getApp,
  cert,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin (serveur) — pour vérifier les ID tokens côté API.
 * Activé seulement si les 3 variables de service account sont présentes.
 *
 * Variables requises (.env.local) :
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  (garde les \n ; on les ré-échappe ci-dessous)
 */
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.replace(/^"|"$/g, "")   // retire les guillemets si Vercel les a inclus
  ?.replace(/\\n/g, "\n");  // convertit \n littéraux en vrais sauts de ligne

export const isAdminEnabled = Boolean(projectId && clientEmail && privateKey);

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

if (isAdminEnabled) {
  try {
    adminApp = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId: projectId!,
            clientEmail: clientEmail!,
            privateKey: privateKey!,
          }),
        });
    adminAuthInstance = getAuth(adminApp);
    adminDbInstance = getFirestore(adminApp);
  } catch (e) {
    console.error("[firebase-admin] init failed:", e);
    // L'app continue sans Admin SDK — les routes API tombent en mode local
  }
}

export const adminAuth = adminAuthInstance;
export const adminDb = adminDbInstance;
