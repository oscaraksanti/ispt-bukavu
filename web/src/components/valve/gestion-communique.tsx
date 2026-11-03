import { X } from "lucide-react";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { Panneau } from "@/components/admin/entete-admin";
import { Encadre, Etiquette } from "@/components/ui/elements";
import type { UtilisateurConnecte } from "@/features/auth/acces";
import { versChampDate } from "@/features/actualites/dates";
import {
  archiverCommunique,
  enregistrerCommunique,
  retirerFichier,
  supprimerCommunique,
  validerCommunique,
} from "@/features/valve/actions";
import { auteurValve, nombreDestinataires } from "@/features/valve/donnees";
import { type Cible, ciblesAutorisees, tauxLecture } from "@/features/valve/regles";
import { INCLURE_AFFICHAGE, optionsCibles, versAffiche } from "@/features/valve/requetes";
import { db } from "@/lib/db";
import { Communique } from "./communique";
import { FormulaireCommunique } from "./formulaire-communique";
import { JoindreFichier } from "./joindre-fichier";

const STATUTS = {
  BROUILLON: { texte: "Brouillon", ton: "neutre" },
  EN_VALIDATION: { texte: "En attente de validation", ton: "attention" },
  PUBLIE: { texte: "Publié", ton: "succes" },
  ARCHIVE: { texte: "Retiré de la valve", ton: "neutre" },
} as const;

/** Édition, pièces jointes, lectures et cycle de vie d'un communiqué. */
export async function GestionCommunique({
  id,
  u,
  retour,
  enregistre,
}: {
  id: string;
  u: UtilisateurConnecte;
  retour: "admin" | "enseignant";
  enregistre: boolean;
}) {
  const c = await db.communique.findUnique({
    where: { id },
    include: { ...INCLURE_AFFICHAGE, _count: { select: { lectures: true } } },
  });
  if (!c) notFound();
  const auteur = await auteurValve(u);
  const gerable =
    c.auteurId === u.id ||
    u.permissions.has("valve.valider") ||
    (c.cible !== "PUBLIC" && c.cible !== "INSTITUT" && u.permissions.has("valve.publier"));
  if (!gerable) notFound();
  const [options, destinataires, lectures] = await Promise.all([
    optionsCibles(auteur),
    nombreDestinataires(c),
    db.lecture.findMany({
      where: { communiqueId: id },
      include: { utilisateur: true },
      orderBy: { luLe: "desc" },
      take: 200,
    }),
  ]);
  const cibles = ciblesAutorisees(auteur);
  const affiche = versAffiche(c);

  return (
    <div className="space-y-6">
      {enregistre && (
        <Encadre ton="succes" titre="Communiqué enregistré">
          Joignez si besoin des documents ci-dessous.
        </Encadre>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Etiquette ton={STATUTS[c.statut].ton}>{STATUTS[c.statut].texte}</Etiquette>
        {c.cible !== "PUBLIC" && c.statut === "PUBLIE" && (
          <span className="text-sm text-pierre-700">
            Lu par {c._count.lectures} étudiant(s) sur {destinataires} (
            {tauxLecture(c._count.lectures, destinataires)} %)
          </span>
        )}
        <span className="flex-1" />
        {c.statut === "EN_VALIDATION" && u.permissions.has("valve.valider") && (
          <BoutonAction action={validerCommunique.bind(null, c.id)} variante="institutionnel">
            Valider et publier
          </BoutonAction>
        )}
        {c.statut === "PUBLIE" && (
          <BoutonAction
            action={archiverCommunique.bind(null, c.id)}
            confirmation="Retirer de la valve ?"
          >
            Retirer de la valve
          </BoutonAction>
        )}
        {c.statut !== "PUBLIE" && (
          <BoutonAction
            action={supprimerCommunique.bind(null, c.id, retour)}
            confirmation="Supprimer définitivement ?"
            variante="fantome"
            className="text-erreur hover:bg-erreur-fond"
          >
            Supprimer
          </BoutonAction>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Panneau titre="Rédaction">
            <FormulaireCommunique
              action={enregistrerCommunique.bind(null, c.id)}
              cibles={cibles.includes(c.cible as Cible) ? cibles : [c.cible as Cible, ...cibles]}
              {...options}
              retour={retour}
              publieDeja={c.statut === "PUBLIE"}
              valeurs={{
                titre: c.titre,
                contenu: c.contenu,
                cible: c.cible as Cible,
                filiereId: c.filiereId ?? "",
                promotionId: c.promotionId ?? "",
                coursOffertId: c.coursOffertId ?? "",
                expireLe: versChampDate(c.expireLe).slice(0, 10),
                epingle: c.epingle,
              }}
            />
          </Panneau>
          <Panneau titre="Pièces jointes" description="Cinq documents au plus, 4 Mo chacun.">
            {c.piecesJointes.length > 0 && (
              <ul className="mb-4 divide-y divide-pierre-200 border-y border-pierre-200">
                {c.piecesJointes.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                    <a
                      href={`/valve/pieces/${p.id}`}
                      target="_blank"
                      rel="noopener"
                      className="flex-1 truncate text-ispt-600 underline hover:no-underline"
                    >
                      {p.media.nomFichier}
                    </a>
                    <BoutonAction
                      action={retirerFichier.bind(null, p.id)}
                      variante="fantome"
                      className="size-8 px-0"
                      libelleAccessible={`Retirer ${p.media.nomFichier}`}
                    >
                      <X aria-hidden />
                    </BoutonAction>
                  </li>
                ))}
              </ul>
            )}
            <JoindreFichier communiqueId={c.id} />
          </Panneau>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Panneau titre="Aperçu">
            <div className="max-h-[32rem] overflow-y-auto">
              <Communique c={affiche} />
            </div>
          </Panneau>
          {c.cible !== "PUBLIC" && lectures.length > 0 && (
            <Panneau titre="Dernières lectures">
              <ul className="-my-2 divide-y divide-pierre-200 text-sm">
                {lectures.slice(0, 30).map((l) => (
                  <li key={l.utilisateurId} className="py-2 text-pierre-800">
                    {[l.utilisateur.nom, l.utilisateur.postnom, l.utilisateur.prenom]
                      .filter(Boolean)
                      .join(" ")}
                  </li>
                ))}
              </ul>
            </Panneau>
          )}
        </div>
      </div>
    </div>
  );
}
