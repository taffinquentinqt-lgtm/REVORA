"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, ArrowRight } from "lucide-react";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { TagInput } from "@/components/ui/TagInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  SECTORS,
  COMPANY_SIZES,
  DEAL_SIZES,
  SALES_CYCLES,
  FIELD_LABELS,
  MAX_LEADS,
} from "@/lib/icp";
import { parseCsv, buildLeads } from "@/lib/csv";
import { apiPost } from "@/lib/api";
import { saveAnalysis, newId } from "@/lib/storage";
import type {
  ICPConfig,
  Sector,
  CompanySize,
  DealSize,
  SalesCycle,
  FieldKey,
  ScoredLead,
  Analysis,
} from "@/lib/types";

const FIELD_ORDER = Object.keys(FIELD_LABELS) as FieldKey[];
const BATCH_SIZE = 5;

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-surface p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-elevated font-mono text-xs text-accent">
          {step}
        </span>
        <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </label>
  );
}

export default function NewAnalysisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  // ICP state
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sizes, setSizes] = useState<CompanySize[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [problems, setProblems] = useState("");
  const [dealSize, setDealSize] = useState<DealSize>(DEAL_SIZES[1]);
  const [salesCycle, setSalesCycle] = useState<SalesCycle>(SALES_CYCLES[1]);

  // CSV state
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string | null>>(
    {} as Record<FieldKey, string | null>
  );

  const [name, setName] = useState("");

  // Run state
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);

  const total = rows.length;

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.rows.length === 0) {
      toast("Aucune ligne exploitable dans ce CSV.", "error");
      return;
    }
    let usable = parsed.rows;
    if (usable.length > MAX_LEADS) {
      usable = usable.slice(0, MAX_LEADS);
      toast(`Limité aux ${MAX_LEADS} premiers leads.`, "info");
    }
    setFileName(file.name);
    setHeaders(parsed.headers);
    setRows(usable);
    setMapping(parsed.mapping);
    if (!name) setName(file.name.replace(/\.csv$/i, ""));
    toast(`${usable.length} leads chargés.`, "success");
  };

  const onInputFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) void handleFile(file);
    else toast("Dépose un fichier .csv", "error");
  };

  const setFieldColumn = (field: FieldKey, column: string) => {
    setMapping((m) => ({ ...m, [field]: column || null }));
  };

  const canLaunch =
    total > 0 &&
    sectors.length > 0 &&
    sizes.length > 0 &&
    !running;

  const launch = async () => {
    const icp: ICPConfig = {
      sectors,
      companySizes: sizes,
      titles,
      problems,
      dealSize,
      salesCycle,
    };
    const leads = buildLeads(rows, mapping);

    setRunning(true);
    setDone(0);
    const results: ScoredLead[] = [];

    try {
      for (let i = 0; i < leads.length; i += BATCH_SIZE) {
        const batch = leads.slice(i, i + BATCH_SIZE);
        const res = await apiPost("/api/analyze", { icp, leads: batch });
        if (!res.ok) {
          const { error } = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(error ?? `Erreur API (${res.status})`);
        }
        const data = (await res.json()) as { results: ScoredLead[] };
        results.push(...data.results);
        setDone(results.length);
      }

      const analysis: Analysis = {
        id: newId(),
        name: name.trim() || "Analyse sans nom",
        createdAt: Date.now(),
        icp,
        results,
      };
      await saveAnalysis(analysis);
      toast("Analyse terminée.", "success");
      router.push(`/analysis/${analysis.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast(message, "error");
      setRunning(false);
    }
  };

  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <main className="mx-auto max-w-[920px] px-5 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Nouvelle analyse
        </h1>
        <p className="mt-1 text-sm text-muted">
          Configure ton ICP, charge ton CSV, lance le scoring.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* STEP 1 — ICP */}
        <Section step={1} title="Configuration ICP">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label>Secteurs cibles</Label>
              <MultiSelect options={SECTORS} selected={sectors} onChange={setSectors} />
            </div>
            <div>
              <Label>Taille d&apos;entreprise</Label>
              <MultiSelect
                options={COMPANY_SIZES}
                selected={sizes}
                onChange={setSizes}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Titres de postes prioritaires</Label>
              <TagInput
                tags={titles}
                onChange={setTitles}
                placeholder="CDO, DSI, Head of Data — Entrée pour ajouter"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Problématiques adressées</Label>
              <textarea
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                rows={2}
                placeholder="Structuration données, activation CDP, conformité…"
                className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent/60"
              />
            </div>
            <div>
              <Label>Deal size moyen</Label>
              <div className="flex gap-2">
                {DEAL_SIZES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDealSize(d)}
                    className={`flex-1 rounded-md border px-2 py-1.5 font-mono text-xs transition-colors ${
                      dealSize === d
                        ? "border-accent bg-accent/15 text-ink"
                        : "border-border bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Cycle de vente</Label>
              <div className="flex gap-2">
                {SALES_CYCLES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSalesCycle(c)}
                    className={`flex-1 rounded-md border px-2 py-1.5 font-mono text-xs transition-colors ${
                      salesCycle === c
                        ? "border-accent bg-accent/15 text-ink"
                        : "border-border bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* STEP 2 — CSV */}
        <Section step={2} title="Import CSV">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={onInputFile}
            className="hidden"
          />
          {!fileName ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-bg/40 px-6 py-12 text-center transition-colors hover:border-accent/60"
            >
              <Upload size={22} className="text-muted" />
              <div>
                <p className="text-sm text-ink">
                  Dépose ton CSV ou clique pour parcourir
                </p>
                <p className="mt-1 font-mono text-xs text-muted">
                  max {MAX_LEADS} leads — détection auto des colonnes
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between rounded-md border border-border bg-bg/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-accent2" />
                  <span className="text-sm text-ink">{fileName}</span>
                  <span className="font-mono text-xs text-muted">
                    {total} leads
                  </span>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-xs text-muted hover:text-ink"
                >
                  Remplacer
                </button>
              </div>

              {/* Mapping */}
              <div>
                <Label>Mapping des colonnes</Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {FIELD_ORDER.map((field) => (
                    <div key={field}>
                      <span className="mb-1 block text-xs text-muted">
                        {FIELD_LABELS[field]}
                      </span>
                      <select
                        value={mapping[field] ?? ""}
                        onChange={(e) => setFieldColumn(field, e.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-accent/60"
                      >
                        <option value="">— ignorer —</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview 5 rows */}
              <div>
                <Label>Aperçu (5 premières lignes)</Label>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-elevated">
                        {FIELD_ORDER.filter((f) => mapping[f]).map((f) => (
                          <th
                            key={f}
                            className="whitespace-nowrap px-3 py-2 font-medium text-muted"
                          >
                            {FIELD_LABELS[f]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          {FIELD_ORDER.filter((f) => mapping[f]).map((f) => (
                            <td
                              key={f}
                              className="whitespace-nowrap px-3 py-2 text-ink"
                            >
                              {row[mapping[f] as string] || (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* STEP 3 — Launch */}
        <Section step={3} title="Lancement">
          <div className="flex flex-col gap-4">
            <div>
              <Label>Nom de l&apos;analyse</Label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Campagne CDO Q3"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent/60"
              />
            </div>

            {running && (
              <div className="rounded-md border border-border bg-bg/40 p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted">Scoring en cours…</span>
                  <span className="font-mono text-ink">
                    {done}/{total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">
                {sectors.length === 0 || sizes.length === 0
                  ? "Sélectionne au moins un secteur et une taille."
                  : total === 0
                  ? "Charge un CSV pour continuer."
                  : `${total} leads prêts à scorer.`}
              </p>
              <Button onClick={launch} disabled={!canLaunch}>
                {running ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Analyse en cours
                  </>
                ) : (
                  <>
                    Lancer l&apos;analyse
                    <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
