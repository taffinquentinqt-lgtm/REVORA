"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

type State = "idle" | "loading" | "done" | "error";

export function WaitlistForm({ source = "landing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "loading" || state === "done") return;
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-lg border border-accent2/40 bg-accent2/10 px-4 py-3 text-sm text-accent2">
        <Check size={16} />
        <span>C&apos;est noté ! On te recontacte bientôt.</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          disabled={state === "loading"}
          aria-label="Adresse email"
          className="flex-1 rounded-lg border border-border bg-surface/60 px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-accent/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="btn-premium inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <>
              Je veux suivre <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>
      {state === "error" && (
        <p className="mt-2 text-center text-xs text-skip">
          Une erreur est survenue. Réessaie.
        </p>
      )}
    </div>
  );
}
