"use client";

import { useEffect, useState } from "react";
import type { ScoringBreakdown } from "@/lib/types";

const CX = 110;
const CY = 100;
const R = 62;

const AXES: { key: keyof ScoringBreakdown; label: string; angle: number }[] = [
  { key: "fit_titre", label: "Titre", angle: -90 },
  { key: "fit_secteur", label: "Secteur", angle: 0 },
  { key: "fit_taille", label: "Taille", angle: 90 },
  { key: "fit_probleme", label: "Problème", angle: 180 },
];

function pt(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
}

/** Progression 0→1 (ease-out cubic) sur `duration`, respecte prefers-reduced-motion. */
function useProgress(duration = 850) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setP(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);
  return p;
}

export function ScoringRadar({
  scoring,
  score,
  size = 220,
}: {
  scoring: ScoringBreakdown;
  score: number;
  size?: number;
}) {
  const p = useProgress();
  const notes = AXES.map((ax) =>
    Math.max(0, Math.min(10, scoring[ax.key]?.note ?? 0))
  );

  const rings = [2, 4, 6, 8, 10];
  const gridPolys = rings.map((lvl) =>
    AXES.map((ax) => {
      const q = pt(ax.angle, (lvl / 10) * R);
      return `${q.x},${q.y}`;
    }).join(" ")
  );

  const dataPoly = AXES.map((ax, i) => {
    const q = pt(ax.angle, (notes[i] / 10) * R * p);
    return `${q.x},${q.y}`;
  }).join(" ");

  const scoreColor =
    score >= 75
      ? "var(--color-go)"
      : score >= 40
      ? "var(--color-maybe)"
      : "var(--color-skip)";

  return (
    <svg
      viewBox="0 0 220 200"
      width={size}
      height={Math.round((size * 200) / 220)}
      role="img"
      aria-label={`Score ${score} sur 100`}
    >
      {/* grille */}
      {gridPolys.map((poly, i) => (
        <polygon key={i} points={poly} fill="none" stroke="var(--color-border)" strokeWidth={1} />
      ))}
      {/* axes */}
      {AXES.map((ax, i) => {
        const q = pt(ax.angle, R);
        return <line key={i} x1={CX} y1={CY} x2={q.x} y2={q.y} stroke="var(--color-border)" strokeWidth={1} />;
      })}
      {/* zone de données */}
      <polygon
        points={dataPoly}
        fill="var(--color-accent)"
        fillOpacity={0.18}
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {AXES.map((ax, i) => {
        const q = pt(ax.angle, (notes[i] / 10) * R * p);
        return <circle key={i} cx={q.x} cy={q.y} r={3} fill="var(--color-accent2)" />;
      })}
      {/* libellés d'axe */}
      {AXES.map((ax, i) => {
        const q = pt(ax.angle, R + 16);
        return (
          <text
            key={i}
            x={q.x}
            y={q.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill="var(--color-muted)"
          >
            {ax.label}
          </text>
        );
      })}
      {/* score central */}
      <circle cx={CX} cy={CY} r={23} fill="var(--color-bg)" fillOpacity={0.75} />
      <text x={CX} y={CY - 2} textAnchor="middle" dominantBaseline="middle" fontSize={24} fontWeight={800} fill={scoreColor}>
        {Math.round(score * p)}
      </text>
      <text x={CX} y={CY + 14} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--color-muted)">
        / 100
      </text>
    </svg>
  );
}
