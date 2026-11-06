import "server-only";
import { lireSession } from "@/features/auth/session";
import { db } from "@/lib/db";
import { decrireAppareil } from "./regles";

/** Identité du titulaire et appareils sur lesquels son compte est ouvert. */
export async function donneesCompte(utilisateurId: string) {
  const [session, compte, sessions] = await Promise.all([
    lireSession(),
    db.utilisateur.findUniqueOrThrow({
      where: { id: utilisateurId },
      select: {
        email: true,
        telephone: true,
        derniereConnexion: true,
        doitChangerMotDePasse: true,
        photoMajLe: true,
        roles: { select: { role: { select: { libelle: true } } } },
        profilEtudiant: { select: { matricule: true } },
      },
    }),
    db.session.findMany({
      where: { utilisateurId, expireLe: { gt: new Date() } },
      orderBy: { creeLe: "desc" },
      select: { id: true, creeLe: true, agent: true },
      take: 20,
    }),
  ]);
  return {
    email: compte.email,
    telephone: compte.telephone,
    matricule: compte.profilEtudiant?.matricule ?? null,
    roles: compte.roles.map((r) => r.role.libelle),
    derniereConnexion: compte.derniereConnexion,
    doitChangerMotDePasse: compte.doitChangerMotDePasse,
    photo: compte.photoMajLe,
    appareils: sessions.map((s) => ({
      id: s.id,
      depuis: s.creeLe,
      appareil: decrireAppareil(s.agent),
      actuel: s.id === session?.sessionId,
    })),
  };
}
