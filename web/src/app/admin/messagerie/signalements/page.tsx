import type { Metadata } from "next";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { traiterSignalement } from "@/features/messagerie/actions";
import { MOTIFS_SIGNALEMENT } from "@/features/messagerie/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Signalements" };

const nom = (u: { prenom: string | null; nom: string } | null) =>
  u ? [u.prenom, u.nom].filter(Boolean).join(" ") : "Compte supprimé";
const quand = (d: Date) => `${formatJour.format(d)} à ${formatHeure.format(d)}`;

/**
 * Modération : seuls les messages signalés sont visibles ici, jamais le reste
 * des conversations.
 */
export default async function Signalements() {
  await exigerPermission("messagerie.moderer");
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
        ariane={[{ libelle: "Messagerie", href: "/admin/messagerie" }, { libelle: "Signalements" }]}
        titre="Signalements"
        description="Messages signalés par les utilisateurs. Masquer un message le remplace par « Message masqué par la modération » pour tous ; chaque décision est inscrite au journal."
      />
      <section className="mt-8 space-y-4">
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
    </>
  );
}
