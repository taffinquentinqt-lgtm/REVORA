"use client";

import { getIdToken } from "./auth";

/** POST JSON authentifié — joint le token d'auth (Bearer) à la requête. */
export async function apiPost(path: string, body: unknown): Promise<Response> {
  const token = await getIdToken();
  return fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

/** GET authentifié. */
export async function apiGet(path: string): Promise<Response> {
  const token = await getIdToken();
  return fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
