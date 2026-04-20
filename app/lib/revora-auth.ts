import users from "../../data/local-users.json";

const AUTH_KEY = "revora_auth_session";

export type RevoraPlan = "demo" | "starter" | "pro" | "unlimited" | "custom";

export type RevoraSession = {
email: string;
plan: RevoraPlan;
monthlyLimit: number | null;
isUnlimited: boolean;
};

type LocalAccount = {
email: string;
password: string;
plan: RevoraPlan;
monthlyLimit: number | null;
isUnlimited: boolean;
};

const ACCOUNTS = users as LocalAccount[];

export async function login(email: string, password: string) {
if (typeof window === "undefined") {
return { error: { message: "Environnement navigateur requis." } };
}

const account = ACCOUNTS.find(
(item) =>
item.email.toLowerCase() === email.trim().toLowerCase() &&
item.password === password
);

if (!account) {
return { error: { message: "Email ou mot de passe incorrect." } };
}

const session: RevoraSession = {
email: account.email,
plan: account.plan,
monthlyLimit: account.monthlyLimit,
isUnlimited: account.isUnlimited,
};

localStorage.setItem(AUTH_KEY, JSON.stringify(session));
return { error: null };
}

export async function logout() {
if (typeof window === "undefined") return;
localStorage.removeItem(AUTH_KEY);
}

export function getSession(): RevoraSession | null {
if (typeof window === "undefined") return null;

const raw = localStorage.getItem(AUTH_KEY);
if (!raw) return null;

try {
return JSON.parse(raw) as RevoraSession;
} catch {
return null;
}
}

export function isLoggedIn() {
return !!getSession();
}
