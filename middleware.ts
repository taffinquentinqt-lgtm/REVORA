import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
const { pathname } = request.nextUrl;

if (pathname.startsWith("/api/")) {
const url = request.nextUrl.clone();
url.pathname = pathname.replace(/^\/api\//, "/API/");
return NextResponse.rewrite(url);
}

return NextResponse.next();
}

export const config = {
matcher: ["/api/:path*"],
};
