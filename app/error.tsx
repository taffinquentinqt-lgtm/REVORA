"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Trace côté client pour le debug (visible dans la console + Vercel logs).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-5">
      <div className="border-gradient glass w-full max-w-md rounded-xl p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-elevated">
          <AlertTriangle size={20} className="text-skip" />
        </div>
        <h1 className="font-display mt-5 text-xl font-bold tracking-tight text-ink">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Quelque chose s&apos;est mal passé de notre côté. Réessaie — si le problème
          persiste, contacte le support.
        </p>
        {error?.digest && (
          <p className="mt-3 font-mono text-[11px] text-muted/60">
            Référence : {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <RotateCcw size={14} /> Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            <Home size={14} /> Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
