import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
return NextResponse.json({
ok: true,
envHasOpenAIKey: !!process.env.OPENAI_API_KEY,
message: "ping ok",
});
}
