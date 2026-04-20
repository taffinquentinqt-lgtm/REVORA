import fs from "fs";
import path from "path";

const [, , email, password, plan, monthlyLimitArg, isUnlimitedArg] = process.argv;

if (!email || !password || !plan) {
console.error(
"Usage: node scripts/create-local-user.mjs email password plan monthlyLimit isUnlimited"
);
console.error(
'Exemple: node scripts/create-local-user.mjs client@revora.app secret123 starter 500 false'
);
process.exit(1);
}

const allowedPlans = ["demo", "starter", "pro", "unlimited", "custom"];

if (!allowedPlans.includes(plan)) {
console.error(`Plan invalide. Plans autorisés: ${allowedPlans.join(", ")}`);
process.exit(1);
}

const isUnlimited = String(isUnlimitedArg).toLowerCase() === "true";
const monthlyLimit =
isUnlimited || monthlyLimitArg === "null" || monthlyLimitArg === undefined
? null
: Number(monthlyLimitArg);

if (!isUnlimited && (monthlyLimit === null || Number.isNaN(monthlyLimit) || monthlyLimit < 0)) {
console.error("monthlyLimit doit être un nombre positif, ou null si isUnlimited=true.");
process.exit(1);
}

const filePath = path.join(process.cwd(), "data", "local-users.json");

if (!fs.existsSync(filePath)) {
console.error("Fichier introuvable: data/local-users.json");
process.exit(1);
}

const raw = fs.readFileSync(filePath, "utf-8");
let users = [];

try {
users = JSON.parse(raw);
} catch (error) {
console.error("Impossible de lire local-users.json");
process.exit(1);
}

const normalizedEmail = email.trim().toLowerCase();
const existingIndex = users.findIndex(
(user) => String(user.email).toLowerCase() === normalizedEmail
);

const newUser = {
email: normalizedEmail,
password,
plan,
monthlyLimit,
isUnlimited,
};

if (existingIndex >= 0) {
users[existingIndex] = newUser;
console.log(`Utilisateur mis à jour: ${normalizedEmail}`);
} else {
users.push(newUser);
console.log(`Utilisateur créé: ${normalizedEmail}`);
}

fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
console.log("Fichier mis à jour ✅");
