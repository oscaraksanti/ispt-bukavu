import { ArrowRight, FileText, Images, Users } from "lucide-react";
import Link from "next/link";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { utilisateurConnecte } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lubumbashi",
});

const LIBELLES_ACTIONS: Record<string, string> = {
  connexion: "Connexion",
  mot_de_passe_defini: "Mot de passe défini",
  contenu_modifie: "Contenu modifié",
  media_ajoute: "Média ajouté",
  media_modifie: "Média modifié",
  media_supprime: "Média supprimé",
  reglages_modifies: "Réglages modifiés",
  utilisateur_cree: "Compte créé",
  utilisateur_modifie: "Compte modifié",
  role_modifie: "Rôle modifié",
};

export default async function TableauDeBord() {
  const u = (await utilisateurConnecte())!;
  const [comptes, medias, pages, journal] = await Promise.all([
    db.utilisateur.count(),
    db.media.count(),
    db.page.count(),
    u.permissions.has("journal.consulter")
      ? db.journalActivite.findMany({
          orderBy: { creeLe: "desc" },
          take: 8,
          include: { auteur: { select: { nom: true, prenom: true } } },
        })
      : Promise.resolve([]),
  ]);

  const raccourcis = [
    { libelle: "Modifier la page d'accueil", href: "/admin/site/pages/accueil", icone: FileText },
    { libelle: "Ajouter des photos", href: "/admin/medias", icone: Images },
    { libelle: "Gérer les comptes", href: "/admin/utilisateurs", icone: Users },
  ];

  return (
    <>
      <EnteteAdmin
        titre={`Bonjour, ${u.prenom ?? u.nom}`}
        description="Vue d'ensemble de la plateforme de l'ISPT-Bukavu."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { valeur: comptes, libelle: "Comptes" },
          { valeur: pages, libelle: "Pages administrables" },
          { valeur: medias, libelle: "Médias" },
        ].map((c) => (
          <div key={c.libelle} className="rounded-md border border-pierre-200 bg-white p-5">
            <p className="font-serif text-4xl text-encre">{c.valeur}</p>
            <p className="mt-2 text-sm text-pierre-600">{c.libelle}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Panneau titre="Raccourcis" className="lg:col-span-2">
          <ul className="-my-2 divide-y divide-pierre-200">
            {raccourcis.map(({ libelle, href, icone: Icone }) => (
              <li key={href}>
                <Link href={href} className="group flex items-center gap-3 py-3 text-pierre-800">
                  <span className="flex size-9 items-center justify-center rounded-xs bg-ispt-50 text-ispt-600">
                    <Icone aria-hidden className="size-4" />
                  </span>
                  <span className="flex-1">{libelle}</span>
                  <ArrowRight
                    aria-hidden
                    className="size-4 text-pierre-500 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Panneau>
        <Panneau titre="Activité récente" className="lg:col-span-3">
          {journal.length === 0 ? (
            <p className="text-sm text-pierre-600">Aucune activité à afficher.</p>
          ) : (
            <ul className="-my-2 divide-y divide-pierre-200">
              {journal.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                  <span className="text-pierre-800">
                    {LIBELLES_ACTIONS[e.action] ?? e.action}
                    <span className="text-pierre-500">
                      {" "}
                      · {[e.auteur?.prenom, e.auteur?.nom].filter(Boolean).join(" ") || "Système"}
                    </span>
                  </span>
                  <time className="shrink-0 font-mono text-xs text-pierre-500">
                    {formatDate.format(e.creeLe)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
      </div>
    </>
  );
}
