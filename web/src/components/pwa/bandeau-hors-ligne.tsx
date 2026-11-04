"use client";

import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

const abonner = (rappel: () => void) => {
  window.addEventListener("online", rappel);
  window.addEventListener("offline", rappel);
  return () => {
    window.removeEventListener("online", rappel);
    window.removeEventListener("offline", rappel);
  };
};

/** Signale la perte de connexion : les informations affichées peuvent dater. */
export function BandeauHorsLigne() {
  const enLigne = useSyncExternalStore(
    abonner,
    () => navigator.onLine,
    () => true,
  );
  if (enLigne) return null;
  return (
    <div
      role="status"
      className="bg-attention px-4 py-2 text-center text-sm font-medium text-white"
    >
      <WifiOff aria-hidden className="mr-2 inline size-4" />
      Hors ligne : vous consultez la dernière version enregistrée sur cet appareil.
    </div>
  );
}
