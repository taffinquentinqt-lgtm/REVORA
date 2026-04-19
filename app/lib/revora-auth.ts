const AUTH_KEY = "revora_demo_auth";

const DEMO_EMAIL = "demo@revora.app";
const DEMO_PASSWORD = "revora123";

export function login(email: string, password: string) {
if (typeof window === "undefined") return false;

const isValid =
email.trim().toLowerCase() === DEMO_EMAIL &&
password === DEMO_PASSWORD;

if (isValid) {
localStorage.setItem(AUTH_KEY, "true");
return true;
}

return false;
}

export function logout() {
if (typeof window === "undefined") return;
localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn() {
if (typeof window === "undefined") return false;
return localStorage.getItem(AUTH_KEY) === "true";
}

export function getDemoCredentials() {
return {
email: DEMO_EMAIL,
password: DEMO_PASSWORD,
};
}
