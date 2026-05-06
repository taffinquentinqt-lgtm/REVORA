"use client";

import { FormEvent, useState } from "react";

type FormStatus =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type ContactResponse = {
  ok?: boolean;
  error?: string;
  fallback?: "mailto";
  mailtoHref?: string;
};

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setPending(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const data = (await response.json()) as ContactResponse;

      if (!response.ok && !data.mailtoHref) {
        throw new Error(data.error || "Le message n'a pas pu etre envoye.");
      }

      if (data.fallback === "mailto" && data.mailtoHref) {
        window.location.href = data.mailtoHref;
        setStatus({
          type: "success",
          message:
            "Ton application email va s'ouvrir avec le message prepare.",
        });
        return;
      }

      form.reset();
      setStatus({
        type: "success",
        message: "Message envoye. On te repond rapidement.",
      });
    } catch (error: unknown) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Le message n'a pas pu etre envoye.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 text-left">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-white/75">
          Nom
          <input
            name="name"
            required
            autoComplete="name"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/60"
            placeholder="Ton nom"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-white/75">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/60"
            placeholder="ton@email.com"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-white/75">
        Entreprise
        <input
          name="company"
          autoComplete="organization"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/60"
          placeholder="Optionnel"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-white/75">
        Message
        <textarea
          name="message"
          required
          minLength={10}
          rows={5}
          className="resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/60"
          placeholder="Dis-nous ce que tu veux analyser avec REVORA..."
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Envoi..." : "Envoyer le message"}
        </button>

        {status.message && (
          <p
            className={`text-sm ${
              status.type === "error" ? "text-rose-300" : "text-cyan-200"
            }`}
            aria-live="polite"
          >
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
