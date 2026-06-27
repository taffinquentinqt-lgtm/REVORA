import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    geminiKey: !!process.env.GEMINI_API_KEY,
    projectId: !!process.env.FIREBASE_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
    privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.slice(0, 40) ?? "",
    nodeEnv: process.env.NODE_ENV,
  });
}
