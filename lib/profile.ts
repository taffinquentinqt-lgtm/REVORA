"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseDb, isFirebaseEnabled } from "./firebase";
import type { AuthUser } from "./auth";

/**
 * Profil utilisateur (validation d'inscription).
 *   • Mode Firebase : doc Firestore users/{uid} avec approved:false à la création.
 *   • Mode local (dev) : tout le monde est approuvé + admin (pour pouvoir tester).
 */
export interface Profile {
  uid: string;
  email: string | null;
  displayName: string | null;
  approved: boolean;
  createdAt: number;
  // Champs onboarding SaaS
  company?: string;
  role?: string;
  teamSize?: string;
  source?: string;
}

/** Emails admin (allowlist) — lus côté client ET serveur via la même variable. */
export function adminEmails(): string[] {
  return (process.env.NEXT_PUBLIC_REVORA_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/** Profil synthétique en mode local : accès complet, pour le dev. */
function localProfile(user: AuthUser): Profile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    approved: true,
    createdAt: Date.now(),
  };
}

/**
 * Garantit l'existence du profil et le retourne.
 * À la 1re connexion : crée le doc avec approved = (admin ? true : false).
 */
export async function ensureProfile(user: AuthUser): Promise<Profile> {
  if (!isFirebaseEnabled || !firebaseDb) return localProfile(user);

  const ref = doc(firebaseDb, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as Profile;

  const profile: Profile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    approved: isAdminEmail(user.email), // les admins sont auto-approuvés
    createdAt: Date.now(),
  };
  await setDoc(ref, profile);
  return profile;
}

/** Crée le profil complet à l'inscription (appelé depuis la page login). */
export async function createProfileWithDetails(
  user: AuthUser,
  details: { company: string; role: string; teamSize: string; source?: string }
): Promise<Profile> {
  const profile: Profile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    approved: isAdminEmail(user.email),
    createdAt: Date.now(),
    ...details,
  };
  if (!isFirebaseEnabled || !firebaseDb) return profile;
  await setDoc(doc(firebaseDb, "users", user.uid), profile);
  return profile;
}

export async function getProfile(user: AuthUser): Promise<Profile | null> {
  if (!isFirebaseEnabled || !firebaseDb) return localProfile(user);
  const snap = await getDoc(doc(firebaseDb, "users", user.uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}
