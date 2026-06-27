"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

/** CTA principal : vers l'analyse si connecté, sinon vers la connexion. */
export function CtaPrimary({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  return (
    <Link
      href={user ? "/analysis/new" : "/login"}
      className={`btn-premium inline-flex items-center gap-2 rounded-md font-semibold text-white ${className}`}
    >
      Analyser mes leads
      <ArrowRight size={16} />
    </Link>
  );
}

/** Lien secondaire "Se connecter" — masqué quand l'utilisateur est déjà connecté. */
export function AuthSecondaryLink() {
  const { user } = useAuth();
  if (user) return null;
  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-accent/60"
    >
      Se connecter
    </Link>
  );
}
