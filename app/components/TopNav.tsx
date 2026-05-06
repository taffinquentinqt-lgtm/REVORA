"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSession, logout } from "../lib/revora-auth";

const ADMIN_EMAILS = ["taffinquentin.qt@gmail.com"];

const baseLinks = [
{ href: "/dashboard", label: "Dashboard" },
{ href: "/analysis", label: "Analysis" },
{ href: "/exports", label: "Exports" },
{ href: "/settings", label: "Settings" },
];

export default function TopNav() {
const pathname = usePathname();
const router = useRouter();
const session = getSession();

const isAdmin =
session && ADMIN_EMAILS.includes(session.email.toLowerCase());

const links = isAdmin
? [...baseLinks, { href: "/admin", label: "Admin" }]
: baseLinks;

async function handleLogout() {
await logout();
router.push("/login");
}

return (
<div className="revora-reveal sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
<div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
<div className="flex items-center gap-3">
<Link
href="/"
className="revora-lift inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2"
>
<span className="revora-pulse h-2.5 w-2.5 rounded-full bg-cyan-400" />
<span className="text-sm font-medium text-white/90">REVORA</span>
</Link>

{session && (
<div className="revora-lift hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 md:block">
{session.email} · {session.plan.toUpperCase()}
</div>
)}
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
? "revora-active-glow border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
: "revora-lift border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
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
className="revora-lift rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10"
>
Logout
</button>
</div>
</div>
</div>
);
}
