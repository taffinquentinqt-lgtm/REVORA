"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Copy,
  Check,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ScoredLead } from "@/lib/types";

interface Props {
  item: ScoredLead;
  treated: boolean;
  onToggleTreated: () => void;
  onClose: () => void;
  onRetry?: () => void;
  retrying?: boolean;
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </h3>
  );
}

export function LeadDrawer({
  item,
  treated,
  onToggleTreated,
  onClose,
  onRetry,
  retrying,
}: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [openObj, setOpenObj] = useState<number | null>(0);
  const [rawOpen, setRawOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Échap pour fermer + focus initial sur le bouton fermer (accessibilité).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { lead, score } = item;
  const fullName = `${lead.firstName} ${lead.lastName}`.trim() || "Lead";

  const copyOuverture = async () => {
    if (!score) return;
    await navigator.clipboard.writeText(score.ouverture);
    setCopied(true);
    toast("Ouverture copiée.", "success");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Fiche ${fullName}`}
        className="drawer-enter relative flex h-full w-full max-w-[520px] flex-col border-l border-border bg-surface"
      >
        {/* header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink">
                {fullName}
              </h2>
              {score &&
                (score.veto ? (
                  <Badge kind="VETO" />
                ) : (
                  <Badge kind={score.priority} />
                ))}
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {lead.title}
              {lead.title && lead.company ? " · " : ""}
              {lead.company}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="rounded text-muted transition-colors hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent/60"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!score ? (
            <div className="rounded-md border border-skip/40 bg-skip/10 p-4">
              <p className="text-sm text-skip">
                Le scoring a échoué pour ce lead.
                {item.error ? ` (${item.error})` : ""}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={retrying}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-skip/50 px-3 py-1.5 text-xs font-medium text-skip transition-colors hover:bg-skip/15 disabled:opacity-50"
                >
                  <RotateCw size={13} className={retrying ? "animate-spin" : ""} />
                  {retrying ? "Nouvel essai…" : "Réessayer"}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* 1 — BRIEFING */}
              <div>
                <Heading>Briefing</Heading>
                <p className="rounded-md bg-elevated p-4 text-sm leading-relaxed text-ink">
                  {score.briefing}
                </p>
              </div>

              {/* 2 — OUVERTURE */}
              <div>
                <Heading>Première phrase — utilisable telle quelle</Heading>
                <div className="rounded-md border border-accent/50 bg-accent/10 p-4">
                  <p className="font-mono text-sm leading-relaxed text-ink">
                    {score.ouverture}
                  </p>
                  <button
                    onClick={copyOuverture}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copié" : "Copier"}
                  </button>
                </div>
              </div>

              {/* 3 — CANAL + TIMING */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Heading>Canal</Heading>
                  <div className="rounded-md border border-border bg-elevated p-3">
                    <span className="inline-flex rounded-[4px] border border-accent/50 bg-accent/10 px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-accent">
                      {score.recommended_channel}
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {score.channel_reasoning}
                    </p>
                  </div>
                </div>
                <div>
                  <Heading>Timing</Heading>
                  <div className="rounded-md border border-border bg-elevated p-3">
                    <p className="text-xs leading-relaxed text-ink">
                      {score.timing}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 — OBJECTIONS */}
              {score.objections.length > 0 && (
                <div>
                  <Heading>Objections</Heading>
                  <div className="flex flex-col gap-2">
                    {score.objections.map((o, i) => {
                      const open = openObj === i;
                      return (
                        <div
                          key={i}
                          className="overflow-hidden rounded-md border border-border bg-elevated"
                        >
                          <button
                            onClick={() => setOpenObj(open ? null : i)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                          >
                            <span className="text-sm text-ink">{o.objection}</span>
                            <ChevronDown
                              size={15}
                              className={`shrink-0 text-muted transition-transform ${
                                open ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {open && (
                            <div className="border-t border-border px-3 py-2.5 text-sm leading-relaxed text-muted">
                              {o.reponse}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5 — LE PIÈGE */}
              <div>
                <Heading>Le piège</Heading>
                <div className="rounded-md border border-skip bg-skip/10 p-4">
                  <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-skip">
                    <AlertTriangle size={13} />
                    Ne pas faire
                  </div>
                  <p className="text-sm leading-relaxed text-ink">{score.piege}</p>
                </div>
              </div>

              {/* 6 — DONNÉES BRUTES */}
              <div>
                <button
                  onClick={() => setRawOpen((v) => !v)}
                  className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-ink"
                >
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${rawOpen ? "rotate-180" : ""}`}
                  />
                  Données brutes
                </button>
                {rawOpen && (
                  <div className="mt-2 overflow-hidden rounded-md border border-border">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {Object.entries(lead.raw).map(([k, v]) => (
                          <tr
                            key={k}
                            className="border-b border-border last:border-0"
                          >
                            <td className="whitespace-nowrap bg-elevated px-3 py-1.5 font-mono text-muted">
                              {k}
                            </td>
                            <td className="px-3 py-1.5 text-ink">{v || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center gap-2 border-t border-border px-6 py-4">
          <Button
            variant={treated ? "secondary" : "primary"}
            onClick={onToggleTreated}
          >
            <CheckCircle2 size={15} />
            {treated ? "Traité" : "Marquer comme traité"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </aside>
    </div>
  );
}
