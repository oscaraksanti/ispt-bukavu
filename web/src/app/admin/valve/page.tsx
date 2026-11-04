import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { LienBouton } from "@/components/ui/bouton";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { exigerPersonnel } from "@/features/auth/acces";
import { validerCommunique } from "@/features/valve/actions";
import { INCLURE_CIBLE, libelleDestinataires } from "@/features/valve/donnees";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Valve numérique" };

const STATUTS = {
  BROUILLON: { texte: "Brouillon", ton: "neutre" },
  EN_VALIDATION: { texte: "À valider", ton: "attention" },
  PUBLIE: { texte: "Publié", ton: "succes" },
  ARCHIVE: { texte: "Retiré", ton: "neutre" },
} as const;

export default async function Valve() {
  const u = await exigerPersonnel();
  const publie = u.permissions.has("valve.publier") || u.permissions.has("valve.publier.institut");
  const valideur = u.permissions.has("valve.valider");
  if (!publie && !valideur) redirect("/acces-refuse");

  const communiques = await db.communique.findMany({
    where: valideur || u.permissions.has("valve.publier") ? {} : { auteurId: u.id },
    include: { ...INCLURE_CIBLE, auteur: true, _count: { select: { lectures: true } } },
    orderBy: [{ statut: "asc" }, { creeLe: "desc" }],
    take: 200,
  });
  const aValider = communiques.filter((c) => c.statut === "EN_VALIDATION");

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Valve" }]}
        titre="Valve numérique"
        description="Communiqués officiels adressés à tout l'institut, à une filière, à une promotion ou aux étudiants d'un cours. Chaque lecture est enregistrée."
        actions={
          <LienBouton href="/admin/valve/nouveau" variante="institutionnel">
            <Plus aria-hidden /> Nouveau communiqué
          </LienBouton>
        }
      />
      {valideur && aValider.length > 0 && (
        <section className="mt-8 rounded-md border border-attention/40 bg-attention-fond p-5">
          <h2 className="font-sans text-base font-semibold text-encre">
            {aValider.length} communiqué(s) en attente de validation
          </h2>
          <ul className="mt-3 space-y-2">
            {aValider.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/admin/valve/${c.id}`}
                  className="flex-1 text-ispt-700 underline hover:no-underline"
                >
                  {c.titre}
                </Link>
                <span className="text-sm text-pierre-600">
                  {[c.auteur.prenom, c.auteur.nom].join(" ")}
                </span>
                <BoutonAction action={validerCommunique.bind(null, c.id)} variante="institutionnel">
                  Valider et publier
                </BoutonAction>
              </li>
            ))}
          </ul>
        </section>
      )}
      {communiques.length === 0 ? (
        <div className="mt-8">
          <EtatVide
            titre="Aucun communiqué"
            description="Le premier communiqué publié apparaîtra sur la valve des étudiants concernés."
          />
        </div>
      ) : (
        <div
          className="mt-8 overflow-x-auto rounded-md border border-pierre-200 bg-white"
          tabIndex={0}
          role="region"
          aria-label="Liste des communiqués"
        >
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-pierre-200 bg-pierre-50 font-mono text-xs tracking-wide text-pierre-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Communiqué
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Destinataires
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  État
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Lectures
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pierre-200">
              {communiques.map((c) => (
                <tr key={c.id} className="hover:bg-pierre-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/valve/${c.id}`}
                      className="font-medium text-encre hover:text-ispt-600"
                    >
                      {c.titre}
                    </Link>
                    <span className="block text-xs text-pierre-500">
                      {[c.auteur.prenom, c.auteur.nom].join(" ")} ·{" "}
                      {formatJour.format(c.publieLe ?? c.creeLe)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-pierre-700">{libelleDestinataires(c)}</td>
                  <td className="px-4 py-3">
                    <Etiquette ton={STATUTS[c.statut].ton}>{STATUTS[c.statut].texte}</Etiquette>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {c.cible === "PUBLIC" ? "—" : c._count.lectures}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
