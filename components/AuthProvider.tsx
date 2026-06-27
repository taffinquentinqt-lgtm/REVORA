"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Clock, LogOut, Mail, RefreshCw, Lock } from "lucide-react";
import { onSnapshot, doc } from "firebase/firestore";
import { subscribe, signOut as authSignOut, resendVerificationEmail, type AuthUser } from "@/lib/auth";
import { ensureProfile, isAdminEmail, getTrialInfo, adminEmails, type Profile, type TrialInfo } from "@/lib/profile";
import { isFirebaseEnabled, firebaseDb } from "@/lib/firebase";

const PUBLIC_ROUTES = ["/", "/login", "/pricing", "/faq", "/legal", "/privacy"];
const isPublic = (p: string) => PUBLIC_ROUTES.includes(p);
const isAdminRoute = (p: string) => p === "/admin" || p.startsWith("/admin/");

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  approved: boolean;
  trial: TrialInfo;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function VerifyEmailScreen({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail();
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const reload = () => window.location.reload();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-5">
      <div className="border-gradient glass w-full max-w-md rounded-xl p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-elevated">
          <Mail size={20} className="text-accent" />
        </div>
        <h1 className="font-display mt-5 text-xl font-bold tracking-tight text-ink">
          Vérifie ton email
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Un lien de confirmation a été envoyé à{" "}
          <span className="font-medium text-ink">{email}</span>. Clique dessus
          pour activer ton compte.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={reload}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw size={14} /> J&apos;ai vérifié mon email
          </button>
          <button
            onClick={resend}
            disabled={loading || sent}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {sent ? "Email renvoyé ✓" : "Renvoyer l'email"}
          </button>
          <button
            onClick={onSignOut}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            <LogOut size={14} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingScreen({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-5">
      <div className="border-gradient glass w-full max-w-md rounded-xl p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-elevated">
          <Clock size={20} className="text-maybe" />
        </div>
        <h1 className="font-display mt-5 text-xl font-bold tracking-tight text-ink">
          Compte en attente de validation
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Ton inscription{email ? ` (${email})` : ""} a bien été enregistrée. Un
          administrateur va valider ton accès — tu seras notifié par email.
        </p>
        <button
          onClick={onSignOut}
          className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <LogOut size={14} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}

function TrialExpiredScreen({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  const admin = adminEmails()[0] ?? "support@revora.app";
  const subject = encodeURIComponent("Débloquer mon abonnement REVORA");
  const body = encodeURIComponent(
    `Bonjour,\n\nMon essai gratuit REVORA est terminé. Je souhaite débloquer mon abonnement.\nCompte : ${email ?? ""}\n\nMerci !`
  );
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-5">
      <div className="border-gradient glass w-full max-w-md rounded-xl p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-elevated">
          <Lock size={20} className="text-maybe" />
        </div>
        <h1 className="font-display mt-5 text-xl font-bold tracking-tight text-ink">
          Ton essai gratuit est terminé
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Tes 14 jours d&apos;essai sont écoulés. Pour continuer à utiliser REVORA,
          contacte l&apos;administrateur pour activer ton abonnement.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <a
            href={`mailto:${admin}?subject=${subject}&body=${body}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Mail size={14} /> Contacter l&apos;administrateur
          </a>
          <button
            onClick={onSignOut}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            <LogOut size={14} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-maybe/30 bg-maybe/10 px-4 py-2 text-center text-xs text-maybe">
      <Clock size={13} />
      <span>
        Essai gratuit — {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant
        {daysLeft > 1 ? "s" : ""}. Pense à activer ton abonnement.
      </span>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = subscribe((u) => {
      if (!alive) return;

      // Nettoie le listener de profil précédent
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }

      setUser(u);
      if (!u) { setProfile(null); setLoading(false); return; }

      // Crée le profil si 1ère connexion, puis écoute les mises à jour en temps réel
      ensureProfile(u)
        .then(() => { if (alive) setLoading(false); })
        .catch(() => { if (alive) setLoading(false); });

      if (isFirebaseEnabled && firebaseDb) {
        const ref = doc(firebaseDb, "users", u.uid);
        unsubProfile = onSnapshot(ref, (snap) => {
          if (!alive) return;
          if (snap.exists()) setProfile(snap.data() as Profile);
        });
      } else {
        // Mode local : profil synthétique
        setProfile({ uid: u.uid, email: u.email, displayName: u.displayName, approved: true, createdAt: Date.now() });
        setLoading(false);
      }
    });

    return () => {
      alive = false;
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Notifie l'admin par email à la 1ère apparition d'un profil non approuvé
  useEffect(() => {
    if (!profile || profile.approved || notifiedRef.current.has(profile.uid)) return;
    notifiedRef.current.add(profile.uid);
    import("@/lib/api").then(({ apiPost }) => {
      apiPost("/api/notify-admin", {
        displayName: profile.displayName,
        email: profile.email,
        company: (profile as Profile & { company?: string }).company,
        role: (profile as Profile & { role?: string }).role,
        teamSize: (profile as Profile & { teamSize?: string }).teamSize,
      }).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, profile?.approved]);

  const isAdmin = !isFirebaseEnabled || isAdminEmail(user?.email);
  const approved = isAdmin || profile?.approved === true;
  const emailVerified = !isFirebaseEnabled || user?.emailVerified !== false;
  // Admins et mode local : accès illimité. Sinon, statut d'essai du profil.
  const trial: TrialInfo =
    isAdmin || !isFirebaseEnabled
      ? { state: "active", daysLeft: 0, trialEndsAt: null }
      : getTrialInfo(profile);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic(pathname)) router.replace("/login");
    else if (user && pathname === "/login") router.replace("/dashboard");
    else if (user && isAdminRoute(pathname) && !isAdmin) router.replace("/dashboard");
  }, [user, loading, isAdmin, pathname, router]);

  const signOut = async () => {
    await authSignOut();
    router.replace("/login");
  };

  let content: ReactNode = children;
  if (!isPublic(pathname)) {
    if (loading || !user) {
      content = (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      );
    } else if (!emailVerified) {
      content = <VerifyEmailScreen email={user.email} onSignOut={signOut} />;
    } else if (!approved) {
      content = <PendingScreen email={user.email} onSignOut={signOut} />;
    } else if (trial.state === "expired") {
      content = <TrialExpiredScreen email={user.email} onSignOut={signOut} />;
    } else if (trial.state === "trial" && trial.daysLeft <= 5) {
      // Accès OK mais essai bientôt fini : bandeau de rappel au-dessus du contenu.
      content = (
        <>
          <TrialBanner daysLeft={trial.daysLeft} />
          {children}
        </>
      );
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, approved, trial, loading, signOut }}>
      {content}
    </AuthContext.Provider>
  );
}
