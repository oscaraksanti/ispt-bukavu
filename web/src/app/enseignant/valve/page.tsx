import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { LienBouton } from "@/components/ui/bouton";
import { extrait, ListeCommuniques } from "@/components/valve/liste-communiques";
import { exigerEnseignant } from "@/features/espaces/acces";
import { INCLURE_CIBLE, libelleDestinataires } from "@/features/valve/donnees";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Valve" };

export default async function ValveEnseignant() {
  const { u } = await exigerEnseignant();
  const lignes = await db.communique.findMany({
    where: { auteurId: u.id },
    include: { ...INCLURE_CIBLE, _count: { select: { piecesJointes: true } } },
    orderBy: { creeLe: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-titre-page leading-tight">Mes communiqués</h1>
          <p className="mt-2 text-pierre-600">Messages adressés aux étudiants de vos cours.</p>
        </div>
        <LienBouton href="/enseignant/valve/nouveau" variante="institutionnel">
          <Plus aria-hidden /> Nouveau
        </LienBouton>
      </div>
      <div className="mt-8">
        <ListeCommuniques
          base="/enseignant/valve"
          vide="Vous n'avez encore publié aucun communiqué."
          communiques={lignes.map((c) => ({
            id: c.id,
            titre: c.titre,
            extrait: extrait(c.contenu),
            publieLe: c.publieLe ?? c.creeLe,
            destinataires: `${libelleDestinataires(c)}${c.statut === "BROUILLON" ? " · brouillon" : c.statut === "ARCHIVE" ? " · retiré" : ""}`,
            epingle: c.epingle,
            pieces: c._count.piecesJointes,
          }))}
        />
      </div>
    </div>
  );
}
