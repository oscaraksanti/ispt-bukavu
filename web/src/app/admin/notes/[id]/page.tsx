import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { TableauNotes } from "@/components/notes/tableau-notes";
import { Etiquette } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { exigerPermission } from "@/features/auth/acces";
import { changerStatutEvaluation } from "@/features/notes/actions";
import { etudiantsDuCours } from "@/features/notes/acces";
import { LIBELLES_EVALUATION, statistiques, TYPES_EVALUATION } from "@/features/notes/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Relecture des notes" };

export default async function RelectureNotes({ params }: PageProps<"/admin/notes/[id]">) {
  await exigerPermission("academique.notes.valider");
  const { id } = await params;
  const e = await db.evaluation.findUnique({
    where: { id },
    include: {
      notes: true,
      coursOffert: {
        include: {
          cours: true,
          promotion: { include: { filiere: true, niveau: true, annee: true } },
          enseignants: { include: { enseignant: { include: { utilisateur: true } } } },
        },
      },
    },
  });
  if (!e) notFound();
  const etudiants = await etudiantsDuCours(e.coursOffertId);
  const seuil = Number(e.coursOffert.promotion.annee.seuilReussite);
  const lignes = etudiants.map((et) => {
    const n = e.notes.find((x) => x.etudiantId === et.id);
    return {
      ...et,
      valeur: n?.valeur == null ? null : Number(n.valeur),
      absent: n?.absent ?? false,
    };
  });
  const stats = statistiques(lignes, seuil);

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Notes", href: `/admin/notes?vue=${e.statut}` },
          { libelle: e.intitule },
        ]}
        titre={`${e.coursOffert.cours.intitule} · ${e.intitule}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Etiquette ton="ispt">{LIBELLES_EVALUATION[e.statut]}</Etiquette>
            {libellePromotion(e.coursOffert.promotion)} · {TYPES_EVALUATION[e.type]} · poids{" "}
            {Number(e.ponderation)} % ·{" "}
            {e.coursOffert.enseignants
              .map((x) =>
                [x.enseignant.titre, x.enseignant.utilisateur.nom].filter(Boolean).join(" "),
              )
              .join(", ")}
          </span>
        }
        actions={
          <>
            {e.statut === "SOUMISE" && (
              <>
                <BoutonAction
                  action={changerStatutEvaluation.bind(null, e.id, "BROUILLON")}
                  confirmation="Renvoyer à l'enseignant pour correction ?"
                >
                  Renvoyer pour correction
                </BoutonAction>
                <BoutonAction
                  action={changerStatutEvaluation.bind(null, e.id, "VALIDEE")}
                  variante="institutionnel"
                  taille="md"
                >
                  Valider
                </BoutonAction>
              </>
            )}
            {e.statut === "VALIDEE" && (
              <>
                <BoutonAction
                  action={changerStatutEvaluation.bind(null, e.id, "BROUILLON")}
                  confirmation="Renvoyer à l'enseignant ?"
                >
                  Renvoyer pour correction
                </BoutonAction>
                <BoutonAction
                  action={changerStatutEvaluation.bind(null, e.id, "PUBLIEE")}
                  variante="institutionnel"
                  taille="md"
                  confirmation="Publier aux étudiants ?"
                >
                  Publier aux étudiants
                </BoutonAction>
              </>
            )}
            {e.statut === "PUBLIEE" && (
              <BoutonAction
                action={changerStatutEvaluation.bind(null, e.id, "VALIDEE")}
                confirmation="Retirer la publication ?"
              >
                Retirer la publication
              </BoutonAction>
            )}
          </>
        }
      />
      {stats && (
        <p className="mt-6 text-sm text-pierre-700">
          Moyenne {stats.moyenne} · min {stats.min} · max {stats.max} · réussite {stats.reussite} %
          (seuil {seuil}) · {stats.absents} absent(s)
        </p>
      )}
      <div className="mt-4">
        <TableauNotes lignes={lignes} seuil={seuil} />
      </div>
    </>
  );
}
