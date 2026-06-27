"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Trash2, Plus } from "lucide-react";
import { listAnalyses, deleteAnalysis } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";
import type { Analysis } from "@/lib/types";

function counts(a: Analysis) {
  const c = { GO: 0, MAYBE: 0, SKIP: 0 };
  a.results.forEach(({ score }) => {
    if (!score || score.veto) return;
    c[score.priority]++;
  });
  return c;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[] | null>(null);

  useEffect(() => {
    let alive = true;
    listAnalyses().then((list) => {
      if (alive) setAnalyses(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const remove = async (id: string, name: string) => {
    await deleteAnalysis(id);
    setAnalyses(await listAnalyses());
    toast(`Analyse « ${name} » supprimée.`, "info");
  };

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">Historique de tes analyses.</p>
        </div>
        <Link
          href="/analysis/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={15} />
          Nouvelle analyse
        </Link>
      </div>

      {analyses === null ? null : analyses.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-surface px-6 py-20 text-center">
          <p className="text-sm text-muted">Aucune analyse. Charge un CSV.</p>
          <Link
            href="/analysis/new"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <Plus size={14} /> Démarrer
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-elevated font-mono text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nom</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Leads</th>
                <th className="px-4 py-2.5 font-medium text-go">GO</th>
                <th className="px-4 py-2.5 font-medium text-maybe">MAYBE</th>
                <th className="px-4 py-2.5 font-medium text-skip">SKIP</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => {
                const c = counts(a);
                return (
                  <tr
                    key={a.id}
                    className="border-b border-border last:border-0 hover:bg-elevated"
                  >
                    <td className="px-4 py-3 text-ink">{a.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted">
                      {a.results.length}
                    </td>
                    <td className="px-4 py-3 font-mono text-go">{c.GO}</td>
                    <td className="px-4 py-3 font-mono text-maybe">{c.MAYBE}</td>
                    <td className="px-4 py-3 font-mono text-skip">{c.SKIP}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/analysis/${a.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:text-ink hover:border-accent/50"
                        >
                          <Eye size={13} /> Voir
                        </Link>
                        <button
                          onClick={() => remove(a.id, a.name)}
                          className="inline-flex items-center gap-1 rounded-md border border-skip/40 px-2.5 py-1 text-xs text-skip transition-colors hover:bg-skip/15"
                        >
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
