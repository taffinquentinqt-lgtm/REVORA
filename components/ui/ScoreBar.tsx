import type { Priority } from "@/lib/types";

const COLORS: Record<Priority, string> = {
  GO: "#00d4aa",
  MAYBE: "#f5a623",
  SKIP: "#ff4d6d",
};

export function ScoreBar({
  score,
  priority,
  veto,
}: {
  score: number;
  priority: Priority;
  veto?: boolean;
}) {
  const color = veto ? "#cc2936" : COLORS[priority];
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm tabular-nums" style={{ color }}>
        {clamped}
      </span>
      <div className="h-1.5 w-[60px] overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
