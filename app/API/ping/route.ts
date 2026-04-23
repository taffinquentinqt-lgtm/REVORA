import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
return NextResponse.json({
ok: true,
envHasMammouthKey: !!process.env.MAMMOUTH_API_KEY,
message: "ping ok",
});
}