# REVORA V2

Sales intelligence B2B pour SDR et Biz Dev. Charge un CSV de leads bruts,
configure ton ICP, et REVORA renvoie pour chaque lead un brief opérationnel :
score, priorité, première phrase d'approche, canal, timing, objections avec
réponses, et le piège à éviter — exportable en Excel.

## Stack

- Next.js 16 (App Router, TypeScript strict)
- Tailwind CSS v4
- Google Gemini API (`gemini-2.5-flash`, REST) — moteur de scoring
- ExcelJS — export Excel stylé (voir note plus bas)
- lucide-react — icônes
- **Auth + données : Firebase** (Auth + Firestore), avec **repli local automatique**
  (localStorage) tant que Firebase n'est pas configuré — l'app reste testable en dev.

## Authentification & accès

L'app est **verrouillée** : seules `/` et `/login` sont publiques. Tout le reste
(`/dashboard`, `/analysis/*`) exige une session, et les routes API
(`/api/analyze`, `/api/export`) vérifient le token côté serveur + appliquent un
rate-limit. Voir [Firebase](#firebase-auth--firestore).

## Setup

```bash
npm install
```

Crée/complète `.env.local` à la racine :

```
GEMINI_API_KEY=...   # clé Google AI Studio (aistudio.google.com/apikey)
```

Puis :

```bash
npm run dev
```

Ouvre http://localhost:3000.

## Parcours

- `/` — landing
- `/analysis/new` — config ICP + upload CSV + aperçu + lancement
- `/analysis/[id]` — tableau scoré + drawer fiche lead + export Excel
- `/dashboard` — historique des analyses (localStorage)

## Format CSV attendu

- Première ligne = en-têtes.
- Max **200 leads** par analyse (au-delà, seuls les 200 premiers sont gardés).
- Détection automatique des colonnes, tolérante aux variations de nommage.
  Le mapping détecté est éditable avant lancement.

Colonnes reconnues (exemples d'alias acceptés) :

| Champ      | Alias acceptés (insensible casse/accents)                     |
| ---------- | ------------------------------------------------------------- |
| Prénom     | `firstname`, `first name`, `prénom`, `prenom`                 |
| Nom        | `lastname`, `last name`, `nom`, `surname`                     |
| Titre      | `title`, `titre`, `poste`, `fonction`, `position`, `role`     |
| Entreprise | `company`, `entreprise`, `société`, `account`, `compte`       |
| Secteur    | `sector`, `secteur`, `industry`, `industrie`, `vertical`      |
| Taille     | `size`, `taille`, `effectif`, `headcount`, `employees`        |
| LinkedIn   | `linkedin`, `linkedin url`, `profil linkedin`                 |
| Email      | `email`, `e-mail`, `mail`, `courriel`                         |
| Téléphone  | `phone`, `téléphone`, `tel`, `mobile`                         |
| Source     | `source`, `origine`, `canal`, `provenance`                    |

Toutes les colonnes non reconnues restent disponibles dans la fiche lead
(« Données brutes ») et dans l'export.

Exemple :

```csv
Prénom,Nom,Titre,Entreprise,Secteur,Taille,LinkedIn,Email,Téléphone,Source
Marie,Dupont,CDO,Acme Data,Data,ETI,https://linkedin.com/in/mdupont,marie@acme.io,+33600000000,Salon Big Data
```

## Firebase (auth + Firestore)

L'app fonctionne dans **deux modes**, choisis automatiquement selon les variables
d'environnement — tu n'as aucun code à modifier pour basculer :

| Mode | Quand | Auth | Stockage |
| --- | --- | --- | --- |
| **Local (dev)** | variables Firebase vides | session localStorage | localStorage |
| **Firebase** | variables remplies | Firebase Auth | Firestore par utilisateur |

### Activer Firebase

1. Crée un projet sur [console.firebase.google.com](https://console.firebase.google.com).
2. Active **Authentication** (Email/Password + Google) et **Firestore**.
3. Récupère la config Web (Paramètres > Général) et remplis dans `.env.local` :

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

4. **Sécurité des API (prod)** — génère une clé de service account
   (Paramètres > Comptes de service > Générer une clé privée) et remplis :

```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> Sans ces 3 dernières variables, les routes API n'acceptent que le token de
> session **locale** (mode dev). En production, configure-les pour une
> vérification cryptographique des ID tokens Firebase.

5. **Admins** : mets ton email dans `.env.local` →
   `NEXT_PUBLIC_REVORA_ADMIN_EMAILS=toi@exemple.com` (plusieurs séparés par `,`).
   Les admins sont auto-approuvés et voient la page `/admin`.

6. Règles Firestore (chacun ne touche que ses données ; **personne ne peut
   s'auto-approuver** depuis le client — l'approbation passe par l'API admin) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    // Profil : lecture/écriture de son propre doc, mais le champ `approved`
    // ne peut pas être modifié par le client (réservé à l'API admin via Admin SDK).
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid
                    && request.resource.data.approved == false;
      allow update: if request.auth != null && request.auth.uid == uid
                    && request.resource.data.approved == resource.data.approved;

      // Analyses de l'utilisateur
      match /analyses/{id} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

## Validation des inscriptions

- À l'inscription, un profil `users/{uid}` est créé avec `approved: false`.
- L'utilisateur non approuvé voit un écran **« Compte en attente de validation »**
  et n'accède à rien (sauf `/` et `/login`).
- Toi (admin) ouvres **`/admin`** → liste des comptes en attente → **Approuver**.
  L'approbation passe par `/api/admin/users` (Admin SDK, vérifie que tu es bien
  dans l'allowlist) — un utilisateur ne peut pas se débloquer lui-même.
- Les admins (allowlist email) sont approuvés automatiquement.

> En mode local (sans Firebase), l'utilisateur de dev est admin + approuvé, mais
> la page `/admin` affiche une erreur car l'Admin SDK n'est pas configuré : c'est
> normal, elle devient fonctionnelle une fois Firebase branché.

### Où c'est branché

- [lib/firebase.ts](lib/firebase.ts) — init client (auth + Firestore)
- [lib/firebase-admin.ts](lib/firebase-admin.ts) — init Admin (vérif tokens API)
- [lib/auth.ts](lib/auth.ts) — auth dual-mode (signin/up/google/out, getIdToken)
- [lib/server-auth.ts](lib/server-auth.ts) — `requireAuth()` + rate-limit sur les routes
- [lib/storage.ts](lib/storage.ts) — analyses Firestore-ou-local

> Rate-limit : 120 req/min/utilisateur, **en mémoire** (par instance serverless).
> L'analyse envoie des batches de 5 leads → un fichier plein (200 leads) = 40
> requêtes, large sous la limite. Pour une limite distribuée en prod, brancher
> un store partagé (Upstash Redis).

## Notes d'implémentation

- **Batch de 5 leads** scorés en parallèle côté serveur, retry ×2 sur erreur
  API. Le client envoie les batches séquentiellement et met à jour la barre de
  progression en temps réel (pas d'état serveur — compatible serverless).
- **Export Excel** : le spec mentionne SheetJS, mais son build communautaire
  (`xlsx`) n'applique pas les remplissages / gras / texte barré (feature Pro).
  L'export utilise donc **ExcelJS** pour livrer fidèlement la mise en forme
  conditionnelle (GO/MAYBE/SKIP/VETO).

## Déploiement

Vercel. Définir `GEMINI_API_KEY` (+ variables Firebase) dans les variables
d'environnement du projet.
