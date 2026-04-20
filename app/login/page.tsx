"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession, login } from "../lib/revora-auth";

export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [message, setMessage] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

useEffect(() => {
const session = getSession();
if (session) {
router.push("/dashboard");
}
}, [router]);

async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
event.preventDefault();
setMessage("");
setIsSubmitting(true);

const { error } = await login(email, password);

if (error) {
setMessage(error.message || "Connexion impossible.");
setIsSubmitting(false);
return;
}

router.push("/dashboard");
}

return (
<main className="min-h-screen bg-slate-950 text-white">
<div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_25%),radial-gradient(circle_at_left,rgba(34,211,238,0.12),transparent_18%)]" />

<div className="relative grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/10 bg-white/5 shadow-2xl shadow-slate-950/40 backdrop-blur-2xl lg:grid-cols-[1.08fr_0.92fr]">
<div className="relative hidden min-h-[680px] overflow-hidden lg:block">
<div
className="absolute inset-0 bg-cover bg-center"
style={{ backgroundImage: "url('/revora-hero.jpg')" }}
/>
<div className="absolute inset-0 bg-slate-950/82" />
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.32),transparent_28%),radial-gradient(circle_at_left,rgba(34,211,238,0.20),transparent_22%)]" />

<div className="relative flex h-full flex-col justify-between p-10">
<div className="flex items-center justify-between">
<div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-xl">
<span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
<span className="text-sm font-medium text-white/90">REVORA</span>
</div>

<div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
Demo access
</div>
</div>

<div>
<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Premium workspace
</p>

<h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-white">
Connecte-toi pour accéder au dashboard REVORA.
</h1>

<p className="mt-5 max-w-lg text-base leading-8 text-white/72">
Accès local simple avec plusieurs plans de démonstration :
demo, starter, pro et unlimited.
</p>
</div>
</div>
</div>

<div className="flex items-center justify-center p-8 md:p-10">
<div className="w-full max-w-md">
<div className="mb-8">
<div className="mb-6 flex items-center justify-between">
<div className="flex items-center gap-4">
<div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/20 bg-white/10 shadow-lg shadow-cyan-500/10">
<Image
src="/revora-logo.png"
alt="REVORA"
width={56}
height={56}
className="h-full w-full object-contain"
/>
</div>

<div>
<p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
REVORA
</p>
<p className="mt-1 text-sm text-white/55">
Sales intelligence platform
</p>
</div>
</div>
</div>

<p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
Login
</p>
<h2 className="mt-3 text-3xl font-semibold text-white">
Connexion
</h2>
<p className="mt-3 text-white/65">
Entre tes identifiants pour accéder à l’application.
</p>
</div>

<form onSubmit={handleLogin} className="grid gap-5">
<div className="grid gap-2">
<label htmlFor="email" className="text-sm font-medium text-white">
Email
</label>
<input
id="email"
type="email"
value={email}
onChange={(event) => setEmail(event.target.value)}
className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40 focus:bg-white/[0.07] placeholder:text-white/35"
placeholder="Votre email"
autoComplete="email"
/>
</div>

<div className="grid gap-2">
<label htmlFor="password" className="text-sm font-medium text-white">
Mot de passe
</label>
<input
id="password"
type="password"
value={password}
onChange={(event) => setPassword(event.target.value)}
className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40 focus:bg-white/[0.07] placeholder:text-white/35"
placeholder="Votre mot de passe"
autoComplete="current-password"
/>
</div>

<button
type="submit"
disabled={isSubmitting}
className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
>
{isSubmitting ? "Connexion..." : "Se connecter"}
</button>

{message && (
<div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3">
<p className="text-sm font-medium text-red-300">
Connexion impossible
</p>
<p className="mt-1 text-sm text-red-200/80">{message}</p>
</div>
)}
</form>

<div className="mt-8 flex items-center justify-between gap-4">
<Link
href="/"
className="text-sm font-medium text-white/55 transition hover:text-white/80"
>
← Retour à l’accueil
</Link>

<p className="text-xs text-white/35">Protected workspace</p>
</div>
</div>
</div>
</div>
</div>
</main>
);
}
