import type { Priority } from "@/lib/types";

export type BadgeKind = Priority | "VETO";

/** color hex per badge kind — used for inline 12% bg + 1px border + text. */
const COLORS: Record<BadgeKind, string> = {
  GO: "#00d4aa",
  MAYBE: "#f5a623",
  SKIP: "#ff4d6d",
  VETO: "#cc2936",
};

export function Badge({ kind }: { kind: BadgeKind }) {
  const c = COLORS[kind];
  return (
    <span
      className="inline-flex items-center rounded-[4px] border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase leading-none tracking-wider"
      style={{
        color: c,
        borderColor: c,
        backgroundColor: `${c}1f`, // ~12% opacity
      }}
    >
      {kind}
    </span>
  );
}
