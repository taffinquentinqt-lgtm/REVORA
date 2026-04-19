"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "../lib/revora-auth";

const links = [
{ href: "/dashboard", label: "Dashboard" },
{ href: "/analysis", label: "Analysis" },
{ href: "/exports", label: "Exports" },
{ href: "/settings", label: "Settings" },
];

export default function TopNav() {
const pathname = usePathname();
const router = useRouter();

function handleLogout() {
logout();
router.push("/login");
}

return (
<div className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
<div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
<div className="flex items-center gap-3">
<Link
href="/"
className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2"
>
<span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
<span className="text-sm font-medium text-white/90">REVORA</span>
</Link>
</div>

<div className="flex items-center gap-3">
<nav className="flex flex-wrap items-center gap-2">
{links.map((link) => {
const active = pathname === link.href;

return (
<Link
key={link.href}
href={link.href}
className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
active
? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
: "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
}`}
>
{link.label}
</Link>
);
})}
</nav>

<button
type="button"
onClick={handleLogout}
className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10"
>
Logout
</button>
</div>
</div>
</div>
);
}
