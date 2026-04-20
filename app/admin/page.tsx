import TopNav from "../components/TopNav";
import AdminProtectedPage from "../components/AdminProtectedPage";
import users from "../../data/local-users.json";

type LocalUser = {
email: string;
password: string;
plan: "demo" | "starter" | "pro" | "unlimited" | "custom";
monthlyLimit: number | null;
isUnlimited: boolean;
};

const localUsers = users as LocalUser[];

function getPlanBadgeClasses(plan: LocalUser["plan"]) {
switch (plan) {
case "demo":
return "bg-slate-500/15 text-slate-300 ring-1 ring-white/10";
case "starter":
return "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30";
case "pro":
return "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30";
case "unlimited":
return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30";
case "custom":
return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30";
default:
return "bg-slate-500/15 text-slate-300 ring-1 ring-white/10";
}
}

export default function AdminPage() {
const unlimitedCount = localUsers.filter((user) => user.isUnlimited).length;
const limitedCount = localUsers.filter((user) => !user.isUnlimited).length;

return (
<AdminProtectedPage>
<main className="min-h-screen bg-slate-950 text-white">
<TopNav />

<div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-6 py-8">
<section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/30">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_left,rgba(34,211,238,0.14),transparent_20%)]" />

<div className="relative p-8 md:p-10">
<p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Admin workspace
</p>

<h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
Gère les comptes
<span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
{" "}
REVORA
</span>
</h1>

<p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
Vue admin des utilisateurs locaux, plans actifs, limites mensuelles
et accès illimités.
</p>

<div className="mt-8 grid gap-4 sm:grid-cols-3">
<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">
Utilisateurs
</p>
<p className="mt-2 text-2xl font-semibold text-white">
{localUsers.length}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">
Plans illimités
</p>
<p className="mt-2 text-2xl font-semibold text-white">
{unlimitedCount}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
<p className="text-xs uppercase tracking-wider text-white/45">
Plans limités
</p>
<p className="mt-2 text-2xl font-semibold text-white">
{limitedCount}
</p>
</div>
</div>
</div>
</section>

<section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
<div>
<p className="text-sm text-cyan-300">Admin users</p>
<h2 className="mt-1 text-2xl font-semibold text-white">
Comptes configurés
</h2>
<p className="mt-2 text-sm text-white/60">
Source :{" "}
<span className="font-medium text-white/80">
data/local-users.json
</span>
</p>
</div>

<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60">
V25 · lecture seule
</div>
</div>

<div className="overflow-auto rounded-3xl border border-white/10">
<table className="min-w-full border-collapse text-sm">
<thead className="bg-white/10 text-white">
<tr>
<th className="px-4 py-3 text-left font-semibold">Email</th>
<th className="px-4 py-3 text-left font-semibold">Mot de passe</th>
<th className="px-4 py-3 text-left font-semibold">Plan</th>
<th className="px-4 py-3 text-left font-semibold">
Limite mensuelle
</th>
<th className="px-4 py-3 text-left font-semibold">Illimité</th>
</tr>
</thead>

<tbody>
{localUsers.map((user, index) => (
<tr
key={`${user.email}-${index}`}
className="border-b border-white/5 bg-white/[0.03] text-white/80 odd:bg-white/[0.02]"
>
<td className="px-4 py-4 font-medium text-white">
{user.email}
</td>
<td className="px-4 py-4">{user.password}</td>
<td className="px-4 py-4">
<span
className={`rounded-full px-3 py-1 text-xs font-semibold ${getPlanBadgeClasses(
user.plan
)}`}
>
{user.plan.toUpperCase()}
</span>
</td>
<td className="px-4 py-4">
{user.monthlyLimit === null ? "—" : user.monthlyLimit}
</td>
<td className="px-4 py-4">
{user.isUnlimited ? "Oui" : "Non"}
</td>
</tr>
))}
</tbody>
</table>
</div>
</section>
</div>
</main>
</AdminProtectedPage>
);
}
