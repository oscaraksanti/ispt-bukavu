import "server-only";
import { libellePromotion } from "@/features/academique/regles";
import { calendrierIcs, libelleSalle, MODALITES } from "./regles";
import type { epreuvesDeLEtudiant } from "./requetes";

type Epreuve = Awaited<ReturnType<typeof epreuvesDeLEtudiant>>[number];

/** Réponse .ics téléchargeable, jamais mise en cache (données personnelles). */
export function reponseAgenda(nom: string, epreuves: Epreuve[]) {
  const ics = calendrierIcs(
    nom,
    epreuves.map((e) => ({
      id: e.id,
      titre: `Examen · ${e.coursOffert.cours.intitule}`,
      debut: e.debut,
      fin: e.fin,
      lieu: e.salle ? `ISPT-Bukavu, ${libelleSalle(e.salle)}` : "ISPT-Bukavu",
      description: `${e.session.libelle} · ${libellePromotion(e.coursOffert.promotion)} · ${MODALITES[e.modalite]}${e.remarque ? ` · ${e.remarque}` : ""}`,
    })),
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="examens-ispt-bukavu.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
