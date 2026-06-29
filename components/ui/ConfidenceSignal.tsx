import type { Confidence } from "@/lib/types";

const CFG: Record<Confidence, { n: number; bar: string; text: string; label: string }> = {
  haute: { n: 3, bar: "bg-go", text: "text-go", label: "Confiance haute" },
  moyenne: { n: 2, bar: "bg-maybe", text: "text-maybe", label: "Confiance moyenne" },
  faible: { n: 1, bar: "bg-skip", text: "text-skip", label: "Confiance faible" },
};

/** Jauge de confiance type signal réseau : 3 barres, remplies selon le niveau. */
export function ConfidenceSignal({
  confidence,
  showLabel = true,
}: {
  confidence: Confidence;
  showLabel?: boolean;
}) {
  const cfg = CFG[confidence] ?? CFG.moyenne;
  return (
    <span className="inline-flex items-center gap-1.5" title={cfg.label}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[1, 2, 3].map((b) => (
          <span
            key={b}
            className={`w-1 rounded-sm ${b <= cfg.n ? cfg.bar : "bg-border"}`}
            style={{ height: `${4 + b * 3}px` }}
          />
        ))}
      </span>
      {showLabel && (
        <span className={`font-mono text-[10px] uppercase tracking-wide ${cfg.text}`}>
          {cfg.label}
        </span>
      )}
    </span>
  );
}
