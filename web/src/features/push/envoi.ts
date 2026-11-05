import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import { abonnementPerime, chargeUtile, type ContenuPush } from "./regles";

const publique = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privee = process.env.VAPID_PRIVATE_KEY;
const sujet = process.env.VAPID_SUJET ?? "mailto:ispt.bk@gmail.com";

/** Les notifications sur le téléphone sont actives si les clés VAPID sont configurées. */
export const pushActive = !!(publique && privee);

let configure = false;
function configurer() {
  if (!configure && pushActive) {
    webpush.setVapidDetails(sujet, publique!, privee!);
    configure = true;
  }
}

/**
 * Envoie une notification à tous les appareils abonnés de ces comptes. Ne lève
 * jamais d'erreur ; les abonnements périmés sont supprimés au passage.
 */
export async function envoyerPush(utilisateurIds: Iterable<string>, contenu: ContenuPush) {
  const ids = [...new Set(utilisateurIds)].filter(Boolean);
  if (!pushActive || !ids.length) return 0;
  configurer();
  try {
    // Comptes actifs seulement, et appareils dont la session est encore ouverte.
    const abonnements = await db.abonnementPush.findMany({
      where: {
        utilisateurId: { in: ids },
        utilisateur: { statut: "ACTIF" },
        session: { expireLe: { gt: new Date() } },
      },
    });
    const charge = chargeUtile(contenu);
    const resultats = await Promise.allSettled(
      abonnements.map((a) =>
        webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          charge,
          {
            TTL: 60 * 60 * 24,
            urgency: "normal",
            topic: contenu.tag?.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32),
          },
        ),
      ),
    );
    const perimes = abonnements
      .filter((_, i) => {
        const r = resultats[i];
        return (
          r.status === "rejected" &&
          abonnementPerime((r.reason as { statusCode?: number }).statusCode)
        );
      })
      .map((a) => a.id);
    if (perimes.length) await db.abonnementPush.deleteMany({ where: { id: { in: perimes } } });
    const envoyes = abonnements
      .filter((_, i) => resultats[i].status === "fulfilled")
      .map((a) => a.id);
    if (envoyes.length)
      await db.abonnementPush.updateMany({
        where: { id: { in: envoyes } },
        data: { dernierEnvoiLe: new Date() },
      });
    return envoyes.length;
  } catch (e) {
    console.error("[push] envoi impossible", e);
    return 0;
  }
}
