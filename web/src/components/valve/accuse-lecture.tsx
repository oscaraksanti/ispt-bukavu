"use client";

import { useEffect } from "react";
import { marquerLu } from "@/features/valve/actions";

/** Enregistre la lecture une fois le communiqué réellement ouvert à l'écran. */
export function AccuseLecture({ communiqueId }: { communiqueId: string }) {
  useEffect(() => {
    marquerLu(communiqueId).catch(() => undefined);
  }, [communiqueId]);
  return null;
}
