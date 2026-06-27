"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Search, Download, ArrowUpDown, Loader2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { Button } from "@/components/ui/Button";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { LeadDrawer } from "@/components/LeadDrawer";
import { useToast } from "@/components/ui/Toast";
import { getAnalysis, saveAnalysis } from "@/lib/storage";
import { apiPost } from "@/lib/api";
import type { Analysis, ScoredLead } from "@/lib/types";

type Filter = "TOUS" | "GO" | "MAYBE" | "SKIP" | "VETO";
type SortKey =
  | "name"
  | "company"
  | "title"
  | "score"
  | "priority"
  | "channel"
  | "ouverture"
  | "timing";

const FILTERS: Filter[] = ["TOUS", "GO", "MAYBE", "SKIP", "VETO"];

function SortHeader({
  k,
  label,
  active,
  onSort,
}: {
  k: SortKey;
  label: string;
  active: boolean;
  onSort: (k: SortKey) => void;
}) {
  return (
    <th className="px-4 py-2 font-medium">
      <button
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${
          active ? "text-ink" : ""
        }`}
      >
        {label}
        <ArrowUpDown size={11} className="opacity-50" />
      </button>
    </th>
  );
}

function matchesFilter(item: ScoredLead, filter: Filter): boolean {
  if (filter === "TOUS") return true;
  if (!item.score) return false;
  if (filter === "VETO") return item.score.veto;
  return item.score.priority === filter && !item.score.veto;
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("TOUS");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [treated, setTreated] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [retrying, setRetrying] = useState<number | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    let alive = true;
    getAnalysis(params.id).then((a) => {
      if (!alive) return;
      setAnalysis(a);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [params?.id]);

  const sortVal = (item: ScoredLead, key: SortKey): string | number => {
    const s = item.score;
    switch (key) {
      case "name":
        return `${item.lead.firstName} ${item.lead.lastName}`.toLowerCase();
      case "company":
        return item.lead.company.toLowerCase();
      case "title":
        return item.lead.title.toLowerCase();
      case "score":
        return s ? s.score : -1;
      case "priority":
        return s ? (s.veto ? "VETO" : s.priority) : "";
      case "channel":
        return s ? s.recommended_channel : "";
      case "ouverture":
        return s ? s.ouverture.toLowerCase() : "";
      case "timing":
        return s ? s.timing.toLowerCase() : "";
    }
  };

  // keep original index so drawer + treated map to the stored array
  const indexed = useMemo(
    () => (analysis ? analysis.results.map((item, idx) => ({ item, idx })) : []),
    [analysis]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = indexed.filter(({ item }) => matchesFilter(item, filter));
    if (q) {
      list = list.filter(
        ({ item }) =>
          `${item.lead.firstName} ${item.lead.lastName}`
            .toLowerCase()
            .includes(q) || item.lead.company.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const va = sortVal(a.item, sortKey);
      const vb = sortVal(b.item, sortKey);
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [indexed, filter, query, sortKey, sortAsc]);

  const counts = useMemo(() => {
    const c = { GO: 0, MAYBE: 0, SKIP: 0, VETO: 0, ERR: 0 };
    analysis?.results.forEach(({ score }) => {
      if (!score) {
        c.ERR++;
        return;
      }
      if (score.veto) c.VETO++;
      else c[score.priority]++;
    });
    return c;
  }, [analysis]);

  const retryLead = async (idx: number) => {
    if (!analysis) return;
    setRetrying(idx);
    try {
      const res = await apiPost("/api/analyze", {
        icp: analysis.icp,
        leads: [analysis.results[idx].lead],
      });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? `Erreur API (${res.status})`);
      }
      const data = (await res.json()) as { results: ScoredLead[] };
      const updated: Analysis = {
        ...analysis,
        results: analysis.results.map((r, i) => (i === idx ? data.results[0] : r)),
      };
      setAnalysis(updated);
      await saveAnalysis(updated);
      if (data.results[0].score) toast("Lead re-scoré.", "success");
      else toast("Nouvel échec sur ce lead.", "error");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Échec du nouvel essai", "error");
    } finally {
      setRetrying(null);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === "score" ? false : true);
    }
  };

  const toggleTreated = (idx: number) => {
    setTreated((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const exportXlsx = async () => {
    if (!analysis) return;
    setExporting(true);
    try {
      const res = await apiPost("/api/export", { analysis });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? "Export impossible");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date(analysis.createdAt).toISOString().slice(0, 10);
      a.href = url;
      a.download = `REVORA_${analysis.name.replace(/\s+/g, "-")}_${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Export Excel généré.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Export impossible", "error");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-[1400px] px-5 py-10">
        <div className="rounded-md border border-border bg-surface">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="mx-auto max-w-[1400px] px-5 py-20 text-center">
        <p className="text-sm text-muted">Analyse introuvable.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <ArrowLeft size={14} /> Retour au dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-8">
      {/* header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
          >
            <ArrowLeft size={12} /> Dashboard
          </Link>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            {analysis.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {analysis.results.length} leads · {counts.GO} GO · {counts.MAYBE}{" "}
            MAYBE · {counts.SKIP} SKIP · {counts.VETO} VETO
            {counts.ERR > 0 && (
              <span className="text-skip"> · {counts.ERR} erreurs</span>
            )}
          </p>
        </div>
        <Button onClick={exportXlsx} disabled={exporting} variant="secondary">
          {exporting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} />
          )}
          Export Excel
        </Button>
      </div>

      {/* controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
                filter === f
                  ? "border-accent bg-accent/15 text-ink"
                  : "border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher nom ou entreprise"
            className="w-[260px] rounded-md border border-border bg-surface py-1.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-accent/60"
          />
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-elevated font-mono text-xs uppercase tracking-wide text-muted">
            <tr>
              {(
                [
                  ["name", "Nom"],
                  ["company", "Entreprise"],
                  ["title", "Titre"],
                  ["score", "Score"],
                  ["priority", "Priorité"],
                  ["channel", "Canal"],
                  ["ouverture", "Ouverture"],
                  ["timing", "Timing"],
                ] as [SortKey, string][]
              ).map(([k, label]) => (
                <SortHeader
                  key={k}
                  k={k}
                  label={label}
                  active={sortKey === k}
                  onSort={toggleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, idx }) => {
              const s = item.score;
              const name =
                `${item.lead.firstName} ${item.lead.lastName}`.trim() || "—";
              return (
                <tr
                  key={idx}
                  onClick={() => setOpenIndex(idx)}
                  style={{ height: 44 }}
                  className={`group cursor-pointer border-b border-border border-l-2 border-l-transparent transition-colors hover:border-l-accent hover:bg-elevated ${
                    treated.has(idx) ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 text-ink">{name}</td>
                  <td className="px-4 text-muted">{item.lead.company || "—"}</td>
                  <td className="px-4 text-muted">{item.lead.title || "—"}</td>
                  <td className="px-4">
                    {s ? (
                      <ScoreBar
                        score={s.score}
                        priority={s.priority}
                        veto={s.veto}
                      />
                    ) : (
                      <span className="font-mono text-xs text-skip">err</span>
                    )}
                  </td>
                  <td className="px-4">
                    {s ? (
                      s.veto ? (
                        <Badge kind="VETO" />
                      ) : (
                        <Badge kind={s.priority} />
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 font-mono text-xs text-muted">
                    {s?.recommended_channel ?? "—"}
                  </td>
                  <td className="max-w-[280px] truncate px-4 text-muted">
                    {s?.ouverture ?? "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-4 text-muted">
                    {s?.timing ?? "—"}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">
                  Aucun lead ne correspond à ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openIndex !== null && analysis.results[openIndex] && (
        <LeadDrawer
          item={analysis.results[openIndex]}
          treated={treated.has(openIndex)}
          onToggleTreated={() => toggleTreated(openIndex)}
          onClose={() => setOpenIndex(null)}
          onRetry={
            analysis.results[openIndex].score
              ? undefined
              : () => retryLead(openIndex)
          }
          retrying={retrying === openIndex}
        />
      )}
    </main>
  );
}
