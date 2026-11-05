"use client";

import { BellRing, BellOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { enregistrerAbonnement, supprimerAbonnement } from "@/features/push/actions";

type Etat = "verification" | "indisponible" | "iphone" | "refusee" | "inactive" | "active";

const CLE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function cleBinaire(base64: string) {
  const b = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
}

/** Activer ou couper les notifications sur ce téléphone (ou cet ordinateur). */
export function NotificationsTelephone() {
  const [etat, setEtat] = useState<Etat>("verification");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  useEffect(() => {
    let actif = true;
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const installe = window.matchMedia("(display-mode: standalone)").matches;
      let suivant: Etat;
      if (!CLE || !("serviceWorker" in navigator)) suivant = "indisponible";
      else if (!("PushManager" in window)) suivant = ios && !installe ? "iphone" : "indisponible";
      else if (Notification.permission === "denied") suivant = "refusee";
      else {
        const r = await navigator.serviceWorker.getRegistration();
        const abonnement = await r?.pushManager.getSubscription();
        // Rattache l'abonnement de l'appareil à la session en cours (il est
        // supprimé côté serveur à chaque fermeture de session).
        const ok = abonnement
          ? (await enregistrerAbonnement(abonnement.toJSON(), navigator.userAgent)).ok
          : false;
        suivant = ok ? "active" : "inactive";
      }
      if (actif) setEtat(suivant);
    })().catch(() => actif && setEtat("indisponible"));
    return () => {
      actif = false;
    };
  }, []);

  const activer = () =>
    demarrer(async () => {
      setErreur(null);
      try {
        if ((await Notification.requestPermission()) !== "granted") {
          setEtat("refusee");
          return;
        }
        const r = await navigator.serviceWorker.ready;
        const abonnement = await r.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: cleBinaire(CLE),
        });
        const reponse = await enregistrerAbonnement(abonnement.toJSON(), navigator.userAgent);
        if (!reponse.ok) throw new Error();
        setEtat("active");
      } catch {
        setErreur("L'activation n'a pas abouti. Réessayez dans un instant.");
      }
    });

  const couper = () =>
    demarrer(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      const abonnement = await r?.pushManager.getSubscription();
      if (abonnement) {
        await supprimerAbonnement(abonnement.endpoint);
        await abonnement.unsubscribe();
      }
      setEtat("inactive");
    });

  const bouton =
    "inline-flex h-10 items-center gap-2 rounded-xs border border-pierre-300 px-4 text-sm font-medium text-encre hover:border-encre disabled:opacity-50";
  return (
    <div>
      {etat === "verification" && <p className="text-detail text-pierre-500">Vérification…</p>}
      {etat === "indisponible" && (
        <p className="text-detail text-pierre-600">
          Ce navigateur ne permet pas les notifications, ou elles ne sont pas encore ouvertes par
          l&apos;institut.
        </p>
      )}
      {etat === "iphone" && (
        <p className="text-detail text-pierre-600">
          Sur iPhone : touchez « Partager », puis « Sur l&apos;écran d&apos;accueil », ouvrez le
          site depuis cette icône et revenez ici.
        </p>
      )}
      {etat === "refusee" && (
        <p className="text-detail text-pierre-600">
          Les notifications sont bloquées pour ce site : autorisez-les dans les réglages du
          navigateur, puis rechargez la page.
        </p>
      )}
      {etat === "inactive" && (
        <button type="button" onClick={activer} disabled={enCours} className={bouton}>
          <BellRing aria-hidden className="size-4" />
          Activer sur cet appareil
        </button>
      )}
      {etat === "active" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-detail font-medium text-succes">Activées sur cet appareil.</p>
          <button type="button" onClick={couper} disabled={enCours} className={bouton}>
            <BellOff aria-hidden className="size-4" />
            Couper
          </button>
        </div>
      )}
      {erreur && (
        <p role="alert" className="mt-2 text-detail text-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}
