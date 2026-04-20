import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
console.error("Variables Supabase manquantes dans .env.local");
process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const users = [
{
email: "demo@revora.app",
password: "revora123",
plan: "demo",
monthly_limit: 200,
is_unlimited: false,
},
{
email: "starter@revora.app",
password: "starter123",
plan: "starter",
monthly_limit: 500,
is_unlimited: false,
},
{
email: "pro@revora.app",
password: "pro123456",
plan: "pro",
monthly_limit: 2000,
is_unlimited: false,
},
{
email: "unlimited@revora.app",
password: "unlimited123",
plan: "unlimited",
monthly_limit: null,
is_unlimited: true,
},
];

async function getUserByEmail(email) {
const { data, error } = await supabase.auth.admin.listUsers();

if (error) {
console.error("Erreur listUsers:", error.message);
return null;
}

return data.users.find((user) => user.email === email) || null;
}

async function createOrUpdateUser(user) {
const existingUser = await getUserByEmail(user.email);

if (existingUser) {
console.log(`Utilisateur déjà existant : ${user.email}`);

const { error: updateError } = await supabase.auth.admin.updateUserById(
existingUser.id,
{
password: user.password,
email_confirm: true,
}
);

if (updateError) {
console.error(`Erreur update auth pour ${user.email}:`, updateError.message);
return;
}

const { error: profileError } = await supabase.from("profiles").upsert({
id: existingUser.id,
email: user.email,
plan: user.plan,
monthly_limit: user.monthly_limit,
is_unlimited: user.is_unlimited,
});

if (profileError) {
console.error(`Erreur upsert profile pour ${user.email}:`, profileError.message);
return;
}

console.log(`Profil mis à jour : ${user.email}`);
return;
}

const { data: createdUser, error: createError } =
await supabase.auth.admin.createUser({
email: user.email,
password: user.password,
email_confirm: true,
});

if (createError) {
console.error(`Erreur création auth pour ${user.email}:`, createError.message);
return;
}

const authUser = createdUser.user;

if (!authUser) {
console.error(`Aucun user retourné pour ${user.email}`);
return;
}

const { error: profileError } = await supabase.from("profiles").upsert({
id: authUser.id,
email: user.email,
plan: user.plan,
monthly_limit: user.monthly_limit,
is_unlimited: user.is_unlimited,
});

if (profileError) {
console.error(`Erreur création profile pour ${user.email}:`, profileError.message);
return;
}

console.log(`Utilisateur créé : ${user.email}`);
}

async function run() {
for (const user of users) {
await createOrUpdateUser(user);
}

console.log("Script terminé ✅");
}

run().catch((error) => {
console.error("Erreur script:", error);
process.exit(1);
});