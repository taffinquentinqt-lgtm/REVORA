import Link from "next/link";
import { Compass, Home, CircleHelp } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-5">
      <div className="border-gradient glass w-full max-w-md rounded-xl p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-elevated">
          <Compass size={20} className="text-accent" />
        </div>
        <p className="font-display mt-5 text-3xl font-extrabold tracking-tight text-gradient">
          404
        </p>
        <h1 className="font-display mt-1 text-xl font-bold tracking-tight text-ink">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Cette page n&apos;existe pas ou a été déplacée. Reviens sur des bases solides.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Home size={14} /> Retour à l&apos;accueil
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            <CircleHelp size={14} /> Consulter la FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}
