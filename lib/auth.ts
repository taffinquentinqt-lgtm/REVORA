"use client";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User as FbUser,
} from "firebase/auth";
import { firebaseAuth, isFirebaseEnabled } from "@/lib/firebase";

/**
 * Couche d'authentification — bascule automatique :
 *   • Firebase si NEXT_PUBLIC_FIREBASE_* configuré
 *   • sinon session locale (localStorage), pour rester testable en dev
 *
 * L'UI (login, garde de routes, nav) ne dépend QUE des fonctions exportées ici.
 */

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

function mapFb(u: FbUser | null): AuthUser | null {
  if (!u) return null;
  return { uid: u.uid, email: u.email, displayName: u.displayName, emailVerified: u.emailVerified };
}

/* ─────────────────────────── MODE LOCAL (fallback) ─────────────────────── */

const SESSION_KEY = "revora.session";
type Listener = (user: AuthUser | null) => void;
const listeners = new Set<Listener>();

function localRead(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function localWrite(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(SESSION_KEY);
  listeners.forEach((cb) => cb(user));
}

function emailToUser(email: string): AuthUser {
  return {
    uid: `local_${btoa(email).replace(/=/g, "")}`,
    email,
    displayName: email.split("@")[0],
    emailVerified: true, // mode local : pas de vérification
  };
}

/* ────────────────────────────── API PUBLIQUE ──────────────────────────── */

export function getCurrentUser(): AuthUser | null {
  if (isFirebaseEnabled && firebaseAuth) return mapFb(firebaseAuth.currentUser);
  return localRead();
}

export function subscribe(cb: Listener): () => void {
  if (isFirebaseEnabled && firebaseAuth) {
    return onAuthStateChanged(firebaseAuth, (u) => cb(mapFb(u)));
  }
  // local
  listeners.add(cb);
  cb(localRead());
  const onStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY) cb(localRead());
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined")
      window.removeEventListener("storage", onStorage);
  };
}

/** Token à envoyer aux routes API (Authorization: Bearer ...). */
export async function getIdToken(): Promise<string | null> {
  if (isFirebaseEnabled && firebaseAuth) {
    const u = firebaseAuth.currentUser;
    return u ? u.getIdToken() : null;
  }
  // mode local : token = base64 du user (vérifié en repli côté serveur)
  const user = localRead();
  if (!user) return null;
  if (typeof window === "undefined") return null;
  return "local." + window.btoa(unescape(encodeURIComponent(JSON.stringify(user))));
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  if (isFirebaseEnabled && firebaseAuth) {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return mapFb(cred.user)!;
  }
  if (!email || !password) throw new Error("Email et mot de passe requis.");
  const user = emailToUser(email);
  localWrite(user);
  return user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> {
  if (isFirebaseEnabled && firebaseAuth) {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    await sendEmailVerification(cred.user);
    return { uid: cred.user.uid, email: cred.user.email, displayName: displayName ?? cred.user.displayName, emailVerified: false };
  }
  if (!email || password.length < 6)
    throw new Error("Mot de passe : 6 caractères minimum.");
  const user: AuthUser = { uid: `local_${btoa(email).replace(/=/g, "")}`, email, displayName: displayName ?? email.split("@")[0], emailVerified: true };
  localWrite(user);
  return user;
}

export async function resendVerificationEmail(): Promise<void> {
  if (isFirebaseEnabled && firebaseAuth?.currentUser) {
    await sendEmailVerification(firebaseAuth.currentUser);
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (isFirebaseEnabled && firebaseAuth) {
    await sendPasswordResetEmail(firebaseAuth, email);
    return;
  }
  throw new Error("Réinitialisation disponible uniquement avec Firebase.");
}

export async function signInWithGoogle(): Promise<AuthUser> {
  if (isFirebaseEnabled && firebaseAuth) {
    const cred = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    return mapFb(cred.user)!;
  }
  const user: AuthUser = {
    uid: "local_google",
    email: "compte.google@revora.app",
    displayName: "Compte Google",
    emailVerified: true,
  };
  localWrite(user);
  return user;
}

export async function signOut(): Promise<void> {
  if (isFirebaseEnabled && firebaseAuth) {
    await fbSignOut(firebaseAuth);
    return;
  }
  localWrite(null);
}
