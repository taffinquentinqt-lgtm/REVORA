import type { NextConfig } from "next";

const nextConfig: NextConfig = {
async rewrites() {
return [
{
source: "/api/:path*",
destination: "/API/:path*",
},
];
},
};

export default nextConfig;