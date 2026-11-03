import "server-only";
import { extrait, type CommuniqueResume } from "@/components/valve/liste-communiques";
import {
  contexteEtudiant,
  filtreEnLigne,
  INCLURE_CIBLE,
  libelleDestinataires,
} from "@/features/valve/donnees";
import { db } from "@/lib/db";

/** Communiqués en ligne qui concernent l'étudiant, avec leur état de lecture. */
export async function valveEtudiant(
  utilisateurId: string,
  limite = 100,
): Promise<CommuniqueResume[]> {
  const ctx = await contexteEtudiant(utilisateurId);
  const lignes = await db.communique.findMany({
    where: filtreEnLigne(ctx),
    include: {
      ...INCLURE_CIBLE,
      lectures: { where: { utilisateurId }, select: { luLe: true } },
      _count: { select: { piecesJointes: true } },
    },
    orderBy: [{ epingle: "desc" }, { publieLe: "desc" }],
    take: limite,
  });
  return lignes.map((c) => ({
    id: c.id,
    titre: c.titre,
    extrait: extrait(c.contenu),
    publieLe: c.publieLe,
    destinataires: libelleDestinataires(c),
    epingle: c.epingle,
    pieces: c._count.piecesJointes,
    lu: c.lectures.length > 0,
  }));
}
