import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const result: Record<string, unknown> = {
    geminiKey: !!process.env.GEMINI_API_KEY,
    projectId: !!process.env.FIREBASE_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
  };

  // Test: can we import firebase-admin ?
  try {
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    result.adminImport = "ok";

    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/^"|"$/g, "")
      ?.replace(/\\n/g, "\n");

    const existing = getApps();
    const app = existing.length
      ? existing[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            privateKey: privateKey!,
          }),
        });
    result.adminInit = "ok";

    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth(app);
    result.adminAuth = !!auth;
  } catch (e) {
    result.adminError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(result);
}
