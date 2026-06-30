import Link from "next/link";

export const metadata = { title: "CGU — REVORA" };

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-[720px] px-5 py-14">
      <div className="mb-10">
        <Link href="/" className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink">
          ← Retour
        </Link>
        <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tight text-ink">
          Conditions Générales d'Utilisation
        </h1>
        <p className="mt-2 font-mono text-xs text-muted">Dernière mise à jour : 27 juin 2026</p>
      </div>

      <div className="flex flex-col gap-10 text-sm leading-relaxed text-muted">

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">1. Objet</h2>
          <p>
            REVORA est une plateforme SaaS de sales intelligence B2B permettant aux équipes commerciales de scorer des fichiers de leads, de générer des briefs d'approche personnalisés et d'exporter les résultats. Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service accessible à l'adresse revora.app et ses sous-domaines.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">2. Accès au service</h2>
          <p className="mb-3">
            L'accès à REVORA est soumis à une inscription préalable et à une validation manuelle par un administrateur. REVORA se réserve le droit d'accepter ou de refuser toute demande d'accès sans avoir à motiver sa décision.
          </p>
          <p>
            L'utilisateur s'engage à fournir des informations exactes lors de son inscription et à maintenir ces informations à jour. Tout compte créé avec des informations frauduleuses pourra être suspendu sans préavis.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">3. Utilisation du service</h2>
          <p className="mb-3">L'utilisateur s'engage à :</p>
          <ul className="ml-4 flex list-disc flex-col gap-2">
            <li>Utiliser REVORA uniquement dans le cadre de prospection commerciale légale et conforme au RGPD.</li>
            <li>Ne pas uploader de données personnelles sans base légale valide (intérêt légitime, consentement, contrat).</li>
            <li>Ne pas tenter de contourner les mécanismes de sécurité ou de rate-limiting.</li>
            <li>Ne pas partager ses identifiants de connexion avec des tiers.</li>
            <li>Ne pas utiliser le service à des fins illégales, abusives ou contraires à l'ordre public.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">4. Données traitées par l'IA</h2>
          <p className="mb-3">
            REVORA utilise une API d'intelligence artificielle fournie par Google (Google LLC) pour analyser les données de leads fournies par l'utilisateur. En uploadant un fichier CSV, l'utilisateur reconnaît et accepte que les données contenues dans ce fichier soient transmises à Google dans le but exclusif de générer des briefs de vente.
          </p>
          <p>
            L'utilisateur est seul responsable de la licéité des données qu'il traite via REVORA et doit s'assurer qu'il dispose des droits nécessaires sur ces données conformément au RGPD et à toute réglementation applicable.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">5. Tarification et abonnement</h2>
          <p className="mb-3">
            L'accès à REVORA est un service payant. Les conditions tarifaires en vigueur sont communiquées lors de l'activation du compte. REVORA se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.
          </p>
          <p>
            En cas de non-paiement, REVORA se réserve le droit de suspendre ou résilier l'accès au compte sans préavis supplémentaire.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">6. Disponibilité et maintenance</h2>
          <p>
            REVORA s'efforce d'assurer la disponibilité du service 24h/24 et 7j/7 mais ne peut garantir une disponibilité sans interruption. Des maintenances planifiées ou des incidents techniques peuvent entraîner des indisponibilités temporaires. REVORA ne pourra être tenu responsable des préjudices résultant d'une indisponibilité du service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">7. Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments constituant REVORA (code source, interface, algorithmes, marques, logos) sont la propriété exclusive de REVORA et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation ou utilisation non autorisée est strictement interdite.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">8. Limitation de responsabilité</h2>
          <p className="mb-3">
            Les briefs et scores générés par REVORA sont fournis à titre indicatif et ne constituent pas des conseils commerciaux garantis. REVORA ne saurait être tenu responsable des décisions prises sur la base des recommandations de la plateforme.
          </p>
          <p>
            La responsabilité de REVORA ne pourra en aucun cas excéder le montant des sommes effectivement versées par l'utilisateur au cours des 3 derniers mois précédant le fait générateur.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">9. Résiliation</h2>
          <p>
            L'utilisateur peut demander la suppression de son compte à tout moment en contactant support@revora.app. REVORA peut résilier l'accès d'un utilisateur en cas de violation des présentes CGU, sans préavis ni indemnité.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">10. Droit applicable</h2>
          <p>
            Les présentes CGU sont régies par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d'accord, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">11. Contact</h2>
          <p>
            Pour toute question relative aux présentes CGU : <a href="mailto:support@revora.app" className="text-accent hover:opacity-80">support@revora.app</a>
          </p>
        </section>

      </div>

      <div className="mt-12 border-t border-border pt-8 flex gap-6 text-xs text-muted">
        <Link href="/privacy" className="hover:text-ink transition-colors">Politique de confidentialité</Link>
        <Link href="/" className="hover:text-ink transition-colors">Accueil</Link>
      </div>
    </main>
  );
}
