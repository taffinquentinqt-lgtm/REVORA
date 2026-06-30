import Link from "next/link";

export const metadata = { title: "Confidentialité — REVORA" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[720px] px-5 py-14">
      <div className="mb-10">
        <Link href="/" className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink">
          ← Retour
        </Link>
        <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tight text-ink">
          Politique de Confidentialité
        </h1>
        <p className="mt-2 font-mono text-xs text-muted">Dernière mise à jour : 29 juin 2026</p>
      </div>

      <div className="flex flex-col gap-10 text-sm leading-relaxed text-muted">

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données personnelles collectées via REVORA est l'éditeur de la plateforme. Pour exercer vos droits ou pour toute question relative à la protection de vos données : <a href="mailto:privacy@revora.app" className="text-accent hover:opacity-80">privacy@revora.app</a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">2. Données collectées</h2>
          <p className="mb-3">REVORA collecte les données suivantes :</p>
          <div className="overflow-hidden rounded-md border border-border">
            {[
              { cat: "Compte", data: "Nom, email, entreprise, poste, taille d'équipe", base: "Exécution du contrat" },
              { cat: "Connexion", data: "Email, mot de passe hashé (Firebase Auth)", base: "Exécution du contrat" },
              { cat: "Leads uploadés", data: "Données du CSV fourni par l'utilisateur", base: "Intérêt légitime / Contrat" },
              { cat: "Analyses", data: "Résultats de scoring, briefs générés", base: "Exécution du contrat" },
              { cat: "Logs techniques", data: "Adresse IP, timestamps des requêtes API", base: "Intérêt légitime (sécurité)" },
              { cat: "Liste de contact", data: "Email laissé via le formulaire de la page d'accueil", base: "Consentement" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 border-b border-border bg-surface px-4 py-3 text-xs last:border-0">
                <span className="font-medium text-ink">{row.cat}</span>
                <span>{row.data}</span>
                <span className="text-muted/70">{row.base}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">3. Finalités du traitement</h2>
          <ul className="ml-4 flex list-disc flex-col gap-2">
            <li>Création et gestion de votre compte utilisateur</li>
            <li>Fourniture du service de scoring et de génération de briefs</li>
            <li>Envoi d'emails transactionnels (vérification, validation de compte, notifications)</li>
            <li>Envoi d'actualités produit et de contenus, uniquement si vous avez laissé votre email volontairement via le formulaire de contact (désinscription possible à tout moment)</li>
            <li>Sécurité et prévention des abus (rate limiting, détection de fraude)</li>
            <li>Amélioration du service (analyse des usages agrégés et anonymisés)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">4. Sous-traitants</h2>
          <p className="mb-3">REVORA fait appel aux sous-traitants suivants :</p>
          <div className="overflow-hidden rounded-md border border-border">
            {[
              { name: "Google Firebase", role: "Authentification + base de données (Firestore)", pays: "UE/USA (SCC)" },
              { name: "Google (API d'IA)", role: "Traitement IA des données de leads", pays: "USA (SCC)" },
              { name: "Resend", role: "Envoi d'emails transactionnels", pays: "USA (SCC)" },
              { name: "Vercel", role: "Hébergement de l'application", pays: "UE/USA (SCC)" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 border-b border-border bg-surface px-4 py-3 text-xs last:border-0">
                <span className="font-medium text-ink">{row.name}</span>
                <span>{row.role}</span>
                <span className="text-muted/70">{row.pays}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted/70">SCC = Clauses Contractuelles Types approuvées par la Commission Européenne.</p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">5. Durée de conservation</h2>
          <ul className="ml-4 flex list-disc flex-col gap-2">
            <li><span className="text-ink">Données de compte</span> — durée de l'abonnement + 3 ans après résiliation</li>
            <li><span className="text-ink">Données de leads uploadées</span> — 12 mois glissants, puis suppression automatique</li>
            <li><span className="text-ink">Logs techniques</span> — 90 jours</li>
            <li><span className="text-ink">Liste de contact / newsletter</span> — jusqu'à votre désinscription</li>
            <li><span className="text-ink">Données de facturation</span> — 10 ans (obligation légale)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">6. Vos droits (RGPD)</h2>
          <p className="mb-3">Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <ul className="ml-4 flex list-disc flex-col gap-2">
            <li><span className="text-ink">Droit d'accès</span> — obtenir une copie de vos données personnelles</li>
            <li><span className="text-ink">Droit de rectification</span> — corriger des données inexactes</li>
            <li><span className="text-ink">Droit à l'effacement</span> — demander la suppression de vos données</li>
            <li><span className="text-ink">Droit à la portabilité</span> — recevoir vos données dans un format structuré</li>
            <li><span className="text-ink">Droit d'opposition</span> — vous opposer à certains traitements</li>
            <li><span className="text-ink">Droit de limitation</span> — limiter le traitement dans certains cas</li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits : <a href="mailto:privacy@revora.app" className="text-accent hover:opacity-80">privacy@revora.app</a>. Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-accent hover:opacity-80">CNIL</a>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">7. Sécurité</h2>
          <p>
            REVORA met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement en transit (HTTPS/TLS), authentification sécurisée via Firebase Auth, accès aux données restreint par utilisateur (Firestore rules), rate limiting des APIs.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">8. Cookies</h2>
          <p>
            REVORA utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d'authentification Firebase). Aucun cookie publicitaire ou de tracking tiers n'est utilisé. La mesure d'audience (Vercel Analytics) est anonyme et fonctionne sans cookie.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">9. Modifications</h2>
          <p>
            REVORA se réserve le droit de modifier la présente politique à tout moment. Les utilisateurs seront informés par email en cas de modification substantielle. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions.
          </p>
        </section>

      </div>

      <div className="mt-12 border-t border-border pt-8 flex gap-6 text-xs text-muted">
        <Link href="/legal" className="hover:text-ink transition-colors">Conditions d'utilisation</Link>
        <Link href="/" className="hover:text-ink transition-colors">Accueil</Link>
      </div>
    </main>
  );
}
