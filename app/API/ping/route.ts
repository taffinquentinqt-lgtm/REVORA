import { NextResponse } from "next/server";

export async function GET() {
return NextResponse.json({
ok: true,
envHasMammouthKey: !!process.env.MAMMOUTH_API_KEY,
message: "ping ok",
});
}