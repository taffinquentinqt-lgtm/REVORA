"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { firebaseDb, isFirebaseEnabled } from "./firebase";
import { getCurrentUser } from "./auth";
import type { Analysis } from "./types";

/**
 * Stockage des analyses — bascule automatique :
 *   • Firestore (par utilisateur : users/{uid}/analyses/{id}) si Firebase actif
 *   • sinon localStorage (mode dev)
 * Toutes les fonctions sont async pour une API homogène entre les deux modes.
 */

const KEY = "revora.analyses";

function firestoreActive(): boolean {
  return isFirebaseEnabled && !!firebaseDb && !!getCurrentUser();
}

function col() {
  const uid = getCurrentUser()!.uid;
  return collection(firebaseDb!, "users", uid, "analyses");
}

function ref(id: string) {
  const uid = getCurrentUser()!.uid;
  return doc(firebaseDb!, "users", uid, "analyses", id);
}

/** Firestore refuse les `undefined` — on nettoie via un round-trip JSON. */
function clean(a: Analysis): Analysis {
  return JSON.parse(JSON.stringify(a)) as Analysis;
}

/* ───────────────────────────── local fallback ─────────────────────────── */

function localAll(): Analysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Analysis[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function localWrite(list: Analysis[]) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(KEY, JSON.stringify(list));
}

/* ────────────────────────────── API publique ──────────────────────────── */

export async function listAnalyses(): Promise<Analysis[]> {
  if (firestoreActive()) {
    const snap = await getDocs(query(col(), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => d.data() as Analysis);
  }
  return localAll().sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  if (firestoreActive()) {
    const snap = await getDoc(ref(id));
    return snap.exists() ? (snap.data() as Analysis) : null;
  }
  return localAll().find((a) => a.id === id) ?? null;
}

export async function saveAnalysis(analysis: Analysis): Promise<void> {
  if (firestoreActive()) {
    await setDoc(ref(analysis.id), clean(analysis));
    return;
  }
  const all = localAll().filter((a) => a.id !== analysis.id);
  all.push(analysis);
  localWrite(all);
}

export async function deleteAnalysis(id: string): Promise<void> {
  if (firestoreActive()) {
    await deleteDoc(ref(id));
    return;
  }
  localWrite(localAll().filter((a) => a.id !== id));
}

export function newId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}
