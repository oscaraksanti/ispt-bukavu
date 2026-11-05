"use client";

import { useEffect } from "react";

/** Enregistre le service worker (production uniquement). */
export function EnregistrementServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}

/** À l'écran de connexion : efface les pages personnelles conservées hors ligne. */
export function ViderEspacesHorsLigne() {
  useEffect(() => {
    navigator.serviceWorker?.controller?.postMessage("vider-espaces");
    if ("caches" in window) caches.delete("ispt-espaces").catch(() => undefined);
    // Appareil partagé : plus aucune notification du compte précédent.
    navigator.serviceWorker
      ?.getRegistration()
      .then((r) => r?.pushManager?.getSubscription())
      .then((a) => a?.unsubscribe())
      .catch(() => undefined);
  }, []);
  return null;
}
