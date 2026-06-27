"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Target,
  MessageSquareQuote,
  ShieldAlert,
  User,
  Building2,
  Briefcase,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } from "@/lib/auth";
import { createProfileWithDetails } from "@/lib/profile";

const VALUE_PROPS = [
  { icon: Target, text: "Ton ICP en entrée, un brief expert en sortie" },
  { icon: MessageSquareQuote, text: "La première phrase exacte à dire, personnalisée" },
  { icon: ShieldAlert, text: "L'erreur à ne pas faire — avant que tu la fasses" },
];

const TEAM_SIZES = ["Solo", "2–5", "6–20", "20–50", "50+"];
const SOURCES = ["LinkedIn", "Recommandation", "Bouche à oreille", "Google", "Autre"];

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 7.1 29.4 5 24 5 12.4 5 3 14.4 3 26s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 7.1 29.4 5 24 5 16.3 5 9.7 9.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 47c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 38 26.7 39 24 39c-5.3 0-9.7-3.6-11.3-8l-6.5 5C9.6 42.6 16.2 47 24 47z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.2C40.9 35.7 45 30.4 45 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  // Champs onboarding
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [source, setSource] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : "Échec";
    const firebase: Record<string, string> = {
      "auth/email-already-in-use": "Cet email est déjà utilisé.",
      "auth/invalid-email": "Email invalide.",
      "auth/weak-password": "Mot de passe trop faible (6 caractères min.).",
      "auth/wrong-password": "Mot de passe incorrect.",
      "auth/user-not-found": "Aucun compte pour cet email.",
      "auth/too-many-requests": "Trop de tentatives, réessaie plus tard.",
      "auth/invalid-credential": "Email ou mot de passe incorrect.",
    };
    const code = (err as { code?: string })?.code;
    toast(code && firebase[code] ? firebase[code] : msg, "error");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "forgot") {
      if (!email) { toast("Saisis ton email.", "error"); return; }
      setLoading("email");
      try {
        await resetPassword(email);
        toast("Email de réinitialisation envoyé.", "success");
        setMode("login");
      } catch (err) { handleError(err); }
      finally { setLoading(null); }
      return;
    }

    if (!email || !password) { toast("Renseigne email et mot de passe.", "error"); return; }

    if (mode === "signup") {
      if (!displayName.trim()) { toast("Indique ton nom.", "error"); return; }
      if (!company.trim()) { toast("Indique ton entreprise.", "error"); return; }
      if (!role.trim()) { toast("Indique ton poste.", "error"); return; }
      if (!teamSize) { toast("Sélectionne la taille de ton équipe.", "error"); return; }
      if (!acceptedTerms) { toast("Accepte les CGU pour continuer.", "error"); return; }
    }

    setLoading("email");
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        toast("Connecté.", "success");
        router.push("/dashboard");
      } else {
        const user = await signUpWithEmail(email, password, displayName.trim());
        await createProfileWithDetails(user, { company: company.trim(), role: role.trim(), teamSize, source });
        toast("Compte créé. En attente de validation.", "success");
        router.push("/dashboard");
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(null);
    }
  };

  const google = async () => {
    setLoading("google");
    try {
      await signInWithGoogle();
      toast("Connecté.", "success");
      router.push("/dashboard");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(null);
    }
  };

  const inputCls = "w-full rounded-md border border-border bg-bg/60 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent/60";

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="bg-grid absolute inset-0" />
      <div className="glow glow-violet drift -left-40 -top-40 h-[460px] w-[460px]" />
      <div className="glow glow-teal absolute -bottom-40 right-0 h-[380px] w-[380px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-[1200px] grid-cols-1 items-center gap-16 px-5 py-12 lg:grid-cols-2">
        {/* LEFT — brand */}
        <div className="hidden flex-col lg:flex">
          <span className="reveal inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted">
            Sales intelligence B2B
          </span>
          <h1 className="reveal reveal-1 font-display mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight">
            <span className="text-gradient">Brief comme un SDR senior.</span>
            <br />
            <span className="text-ink">Prospecte comme une machine.</span>
          </h1>
          <p className="reveal reveal-2 mt-5 max-w-md text-base leading-relaxed text-muted">
            Connecte-toi pour retrouver tes analyses, scorer tes leads et générer tes briefs d&apos;approche.
          </p>
          <div className="reveal reveal-3 mt-10 flex flex-col gap-3">
            {VALUE_PROPS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-elevated">
                  <Icon size={15} className="text-accent" />
                </span>
                <span className="text-sm text-ink/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — auth card */}
        <div className="reveal reveal-2 mx-auto w-full max-w-[440px]">
          <div className="border-gradient glass rounded-xl p-7">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                {mode === "login" ? "Connexion" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {mode === "login"
                  ? "Accède à ton espace REVORA."
                  : mode === "signup"
                  ? "Quelques infos pour personnaliser ton expérience."
                  : "On t'envoie un lien de réinitialisation."}
              </p>
            </div>

            {mode !== "forgot" && (
              <>
                <button
                  onClick={google}
                  disabled={loading !== null}
                  className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-elevated px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent/60 disabled:opacity-50"
                >
                  {loading === "google" ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
                  Continuer avec Google
                </button>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">ou</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <form onSubmit={submit} className="flex flex-col gap-3">
              {/* Nom complet — signup only */}
              {mode === "signup" && (
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nom complet"
                    autoComplete="name"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  autoComplete="email"
                  className={inputCls}
                />
              </div>

              {/* Mot de passe — login + signup */}
              {mode !== "forgot" && (
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="w-full rounded-md border border-border bg-bg/60 py-2.5 pl-9 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
                    aria-label={showPwd ? "Masquer" : "Afficher"}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              )}

              {mode === "login" && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted transition-colors hover:text-ink">
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              {/* Champs onboarding — signup only */}
              {mode === "signup" && (
                <div className="flex flex-col gap-3 border-t border-border pt-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Ton contexte</p>

                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Entreprise"
                      className={inputCls}
                    />
                  </div>

                  <div className="relative">
                    <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Poste (ex : SDR, BDR, Account Executive…)"
                      className={inputCls}
                    />
                  </div>

                  <div className="relative">
                    <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <select
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full appearance-none rounded-md border border-border bg-bg/60 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors focus:border-accent/60 [&:not([value=''])]:text-ink [&[value='']]:text-muted"
                    >
                      <option value="" disabled>Taille de l&apos;équipe commerciale</option>
                      {TEAM_SIZES.map((s) => <option key={s} value={s}>{s} personne{s === "Solo" ? "" : "s"}</option>)}
                    </select>
                  </div>

                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full appearance-none rounded-md border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent/60 [&[value='']]:text-muted"
                  >
                    <option value="">Comment avez-vous connu REVORA ? (optionnel)</option>
                    {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                    />
                    <span className="text-xs text-muted leading-relaxed">
                      J&apos;accepte les{" "}
                      <Link href="/legal" target="_blank" className="text-accent hover:opacity-80">
                        Conditions d&apos;utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link href="/privacy" target="_blank" className="text-accent hover:opacity-80">
                        Politique de confidentialité
                      </Link>
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading !== null}
                className="btn-premium mt-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading === "email" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              {mode === "forgot" ? (
                <>
                  <button onClick={() => setMode("login")} className="font-medium text-accent transition-opacity hover:opacity-80">
                    ← Retour à la connexion
                  </button>
                </>
              ) : mode === "login" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button onClick={() => setMode("signup")} className="font-medium text-accent transition-opacity hover:opacity-80">
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{" "}
                  <button onClick={() => setMode("login")} className="font-medium text-accent transition-opacity hover:opacity-80">
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 text-xs text-muted">
            <Link href="/" className="transition-colors hover:text-ink">← Accueil</Link>
            <Link href="/legal" target="_blank" className="transition-colors hover:text-ink">CGU</Link>
            <Link href="/privacy" target="_blank" className="transition-colors hover:text-ink">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
