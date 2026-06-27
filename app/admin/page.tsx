"use client";

import { useEffect, useState } from "react";
import { Check, X, ShieldCheck, Loader2, Clock } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface UserRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  approved: boolean;
  createdAt: number;
  company?: string;
  role?: string;
  teamSize?: string;
  source?: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiGet("/api/admin/users");
        if (!res.ok) {
          const { error: e } = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          if (alive) {
            setError(e ?? `Erreur (${res.status})`);
            setUsers([]);
          }
          return;
        }
        const data = (await res.json()) as { users: UserRow[] };
        if (alive) {
          setError(null);
          setUsers(data.users);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
          setUsers([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setApproved = async (uid: string, approved: boolean) => {
    setBusy(uid);
    try {
      const res = await apiPost("/api/admin/users", { uid, approved });
      if (!res.ok) {
        const { error: e } = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(e ?? "Échec");
      }
      setUsers((prev) =>
        prev ? prev.map((u) => (u.uid === uid ? { ...u, approved } : u)) : prev
      );
      toast(approved ? "Compte approuvé." : "Accès retiré.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Échec", "error");
    } finally {
      setBusy(null);
    }
  };

  const pending = users?.filter((u) => !u.approved) ?? [];
  const approved = users?.filter((u) => u.approved) ?? [];

  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <div className="mb-8 flex items-center gap-2">
        <ShieldCheck size={20} className="text-accent" />
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Administration
        </h1>
      </div>

      {users === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-skip/40 bg-skip/10 p-4 text-sm text-skip">
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* En attente */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-maybe">
              <Clock size={13} /> En attente ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="rounded-md border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
                Aucune inscription en attente.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                {pending.map((u) => (
                  <Row
                    key={u.uid}
                    user={u}
                    busy={busy === u.uid}
                    onApprove={() => setApproved(u.uid, true)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Approuvés */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent2">
              <Check size={13} /> Approuvés ({approved.length})
            </h2>
            {approved.length === 0 ? (
              <p className="rounded-md border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
                Aucun compte approuvé.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                {approved.map((u) => (
                  <Row
                    key={u.uid}
                    user={u}
                    busy={busy === u.uid}
                    onRevoke={() => setApproved(u.uid, false)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function Row({
  user,
  busy,
  onApprove,
  onRevoke,
}: {
  user: UserRow;
  busy: boolean;
  onApprove?: () => void;
  onRevoke?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-medium text-ink">{user.displayName || (user.email ?? "—")}</p>
          {user.company && <span className="shrink-0 font-mono text-xs text-muted">{user.company}</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="truncate font-mono text-xs text-muted">{user.email ?? user.uid}</p>
          {user.role && <span className="text-xs text-muted/70">· {user.role}</span>}
          {user.teamSize && <span className="text-xs text-muted/70">· {user.teamSize} pers.</span>}
          {user.source && <span className="text-xs text-muted/50">· via {user.source}</span>}
          {user.createdAt ? <span className="text-xs text-muted/50">· {new Date(user.createdAt).toLocaleDateString("fr-FR")}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onApprove && (
          <button
            onClick={onApprove}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-accent2/40 bg-accent2/10 px-2.5 py-1 text-xs font-medium text-accent2 transition-colors hover:bg-accent2/20 disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Approuver
          </button>
        )}
        {onRevoke && (
          <button
            onClick={onRevoke}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-skip/40 px-2.5 py-1 text-xs font-medium text-skip transition-colors hover:bg-skip/15 disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
            Retirer l&apos;accès
          </button>
        )}
      </div>
    </div>
  );
}
