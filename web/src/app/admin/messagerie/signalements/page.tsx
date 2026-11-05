import type { Metadata } from "next";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Encadre } from "@/components/ui/elements";
import {
  enregistrerReglagesCampus,
  traiterSignalementCampus,
  validerPublication,
} from "@/features/campus/actions";
import { lireReglagesCampus } from "@/features/campus/reglages";
import { traiterSignalement } from "@/features/messagerie/actions";
import { MOTIFS_SIGNALEMENT } from "@/features/messagerie/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Modération" };

const nom = (u: { prenom: string | null; nom: string } | null) =>
  u ? [u.prenom, u.nom].filter(Boolean).join(" ") : "Compte supprimé";
const quand = (d: Date) => `${formatJour.format(d)} à ${formatHeure.format(d)}`;

/**
 * Modération : seuls les messages signalés sont visibles ici, jamais le reste
 * des conversations.
 */
export default async function Signalements() {
  await exigerPermission("messagerie.moderer");
  const [aValider, signalesCampus, reglages] = await Promise.all([
    db.publication.findMany({
      where: { statut: "EN_ATTENTE", supprimeLe: null },
      include: {
        auteur: { select: { prenom: true, nom: true } },
        _count: { select: { medias: true } },
      },
      orderBy: { creeLe: "asc" },
    }),
    db.signalementCampus.findMany({
      where: { traiteLe: null },
      include: {
        publication: {
          select: {
            contenu: true,
            masqueLe: true,
            auteur: { select: { prenom: true, nom: true } },
          },
        },
        commentaire: {
          select: {
            contenu: true,
            masqueLe: true,
            auteur: { select: { prenom: true, nom: true } },
          },
        },
      },
      orderBy: { creeLe: "asc" },
    }),
    lireReglagesCampus(),
  ]);
  const parCible = [...Map.groupBy(signalesCampus, (s) => s.cible).entries()];
  const [ouverts, traites] = await Promise.all([
    db.message.findMany({
      where: { signalements: { some: { traiteLe: null } } },
      include: {
        auteur: { select: { prenom: true, nom: true } },
        conversation: { select: { type: true, titre: true } },
        media: { select: { nomFichier: true } },
        signalements: { where: { traiteLe: null }, orderBy: { creeLe: "asc" } },
      },
      orderBy: { creeLe: "desc" },
      take: 100,
    }),
    db.signalementMessage.findMany({
      where: { traiteLe: { not: null } },
      distinct: ["messageId"],
      orderBy: { traiteLe: "desc" },
      take: 20,
      include: { message: { select: { contenu: true, masqueLe: true } } },
    }),
  ]);

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Messagerie", href: "/admin/messagerie" }, { libelle: "Modération" }]}
        titre="Modération"
        description="Publications du Campus à valider, contenus et messages signalés. Seuls les contenus signalés sont visibles ici, jamais le reste des conversations ; chaque décision est inscrite au journal."
      />

      <section id="campus-a-valider" className="mt-8 scroll-mt-24">
        <h2 className="text-2xl">Campus : publications à valider</h2>
        <div className="mt-4 space-y-4">
          {aValider.length === 0 && (
            <p className="text-pierre-600">
              {reglages.validationPrealable
                ? "Aucune publication en attente."
                : "La validation préalable est désactivée : les publications paraissent directement."}
            </p>
          )}
          {aValider.map((p) => (
            <Panneau
              key={p.id}
              titre={nom(p.auteur)}
              description={`Envoyée le ${quand(p.creeLe)}${p._count.medias ? ` · ${p._count.medias} photo(s)` : ""}`}
            >
              <blockquote className="border-l-2 border-pierre-300 pl-4 whitespace-pre-wrap text-pierre-900">
                {p.contenu || "(photos seulement)"}
              </blockquote>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-pierre-100 pt-4">
                <BoutonAction
                  action={validerPublication.bind(null, p.id, "PUBLIEE")}
                  variante="institutionnel"
                >
                  Publier
                </BoutonAction>
                <BoutonAction
                  action={validerPublication.bind(null, p.id, "REFUSEE")}
                  variante="danger"
                  confirmation="Refuser cette publication ?"
                >
                  Refuser
                </BoutonAction>
              </div>
            </Panneau>
          ))}
        </div>
      </section>

      <section id="campus" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl">Campus : contenus signalés</h2>
        <div className="mt-4 space-y-4">
          {parCible.length === 0 && (
            <p className="text-pierre-600">Aucun signalement en attente.</p>
          )}
          {parCible.map(([cible, liste]) => {
            const c = liste[0].publication ?? liste[0].commentaire;
            const type = cible.startsWith("publication:") ? "Publication" : "Commentaire";
            return (
              <Panneau
                key={cible}
                titre={`${type} de ${nom(c?.auteur ?? null)}`}
                description={
                  c?.masqueLe ? "Masqué automatiquement en attendant votre décision" : undefined
                }
                actions={
                  <span className="rounded-xs bg-erreur-fond px-2 py-1 text-detail font-medium text-erreur">
                    {liste.length} signalement{liste.length > 1 ? "s" : ""}
                  </span>
                }
              >
                <blockquote className="border-l-2 border-pierre-300 pl-4 whitespace-pre-wrap text-pierre-900">
                  {c?.contenu || "(contenu supprimé par son auteur ou photos seulement)"}
                </blockquote>
                <ul className="mt-4 flex flex-wrap gap-2 text-detail">
                  {liste.map((s) => (
                    <li key={s.id} className="rounded-xs bg-pierre-100 px-2 py-1 text-pierre-700">
                      {MOTIFS_SIGNALEMENT[s.motif as keyof typeof MOTIFS_SIGNALEMENT] ?? s.motif}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-pierre-100 pt-4">
                  <BoutonAction
                    action={traiterSignalementCampus.bind(null, cible, "MASQUE")}
                    variante="danger"
                    confirmation="Masquer ce contenu pour tous ?"
                  >
                    Masquer
                  </BoutonAction>
                  <BoutonAction action={traiterSignalementCampus.bind(null, cible, "CLASSE")}>
                    {c?.masqueLe ? "Rétablir et classer" : "Classer sans suite"}
                  </BoutonAction>
                </div>
              </Panneau>
            );
          })}
        </div>
      </section>

      <h2 className="mt-12 text-2xl">Messagerie : messages signalés</h2>
      <section className="mt-4 space-y-4">
        {ouverts.length === 0 && <p className="text-pierre-600">Aucun signalement en attente.</p>}
        {ouverts.map((m) => (
          <Panneau
            key={m.id}
            id={m.signalements[0]?.id}
            titre={`${nom(m.auteur)} · ${m.conversation.type === "PRIVEE" ? "conversation privée" : (m.conversation.titre ?? "groupe")}`}
            description={`Envoyé le ${quand(m.creeLe)}`}
            actions={
              <span className="rounded-xs bg-erreur-fond px-2 py-1 text-detail font-medium text-erreur">
                {m.signalements.length} signalement{m.signalements.length > 1 ? "s" : ""}
              </span>
            }
          >
            <blockquote className="border-l-2 border-pierre-300 pl-4 whitespace-pre-wrap text-pierre-900">
              {m.supprimeLe
                ? "(message supprimé par son auteur)"
                : m.contenu || (m.media ? `Pièce jointe : ${m.media.nomFichier}` : "")}
            </blockquote>
            <ul className="mt-4 flex flex-wrap gap-2 text-detail">
              {m.signalements.map((s) => (
                <li key={s.id} className="rounded-xs bg-pierre-100 px-2 py-1 text-pierre-700">
                  {MOTIFS_SIGNALEMENT[s.motif as keyof typeof MOTIFS_SIGNALEMENT] ?? s.motif}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-pierre-100 pt-4">
              <BoutonAction
                action={traiterSignalement.bind(null, m.id, "MASQUE")}
                variante="danger"
                confirmation="Masquer ce message pour tous ?"
              >
                Masquer le message
              </BoutonAction>
              <BoutonAction action={traiterSignalement.bind(null, m.id, "CLASSE")}>
                Classer sans suite
              </BoutonAction>
            </div>
          </Panneau>
        ))}
      </section>
      {traites.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl">Derniers signalements traités</h2>
          <ul className="mt-4 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white text-sm">
            {traites.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-5 py-3">
                <span className="min-w-0 flex-1 truncate text-pierre-700">
                  {s.message.contenu || "(pièce jointe ou message retiré)"}
                </span>
                <span className="shrink-0 text-detail text-pierre-500">
                  {s.decision === "MASQUE" ? "Masqué" : "Classé"} · {formatJour.format(s.traiteLe!)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Panneau
        id="reglages-campus"
        className="mt-12"
        titre="Réglages du Campus"
        description="Validation préalable des publications des étudiants et règles affichées avant la première publication."
      >
        {reglages.reglesParDefaut && (
          <Encadre ton="attention" titre="Règles proposées par défaut" className="mb-5">
            Ce texte est une proposition : faites-le valider par l&apos;institut, puis enregistrez
            la version retenue.
          </Encadre>
        )}
        <FormulaireAction action={enregistrerReglagesCampus} libelleEnvoi="Enregistrer">
          <label className="flex items-start gap-3 text-sm text-encre">
            <input
              type="checkbox"
              name="validationPrealable"
              defaultChecked={reglages.validationPrealable}
              className="mt-0.5 size-4 accent-ispt-600"
            />
            <span>
              Valider les publications des étudiants avant leur parution
              <span className="block text-detail text-pierre-500">
                Le personnel et les enseignants publient toujours directement.
              </span>
            </span>
          </label>
          <div>
            <label htmlFor="regles" className="text-sm font-medium text-encre">
              Règles du Campus (une règle par ligne)
            </label>
            <textarea
              id="regles"
              name="regles"
              rows={7}
              maxLength={3000}
              defaultValue={reglages.regles}
              className="mt-1.5 block w-full rounded-md border border-pierre-300 px-3 py-2 text-sm outline-none focus:border-ispt-600 focus:ring-2 focus:ring-ispt-600/20"
            />
          </div>
        </FormulaireAction>
      </Panneau>
    </>
  );
}
