"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { styleBouton } from "@/components/ui/bouton";
import { cn } from "@/lib/cn";
import {
  espacesDisponibles,
  lienCandidature,
  liensUtilitaires,
  navigationPrincipale,
} from "./navigation";

export function MenuMobile() {
  const [ouvert, setOuvert] = useState(false);
  const chemin = usePathname();
  const [cheminOuverture, setCheminOuverture] = useState(chemin);

  // Ferme le menu après une navigation.
  if (chemin !== cheminOuverture) {
    setCheminOuverture(chemin);
    setOuvert(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = ouvert ? "hidden" : "";
    const surEchap = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    window.addEventListener("keydown", surEchap);
    return () => window.removeEventListener("keydown", surEchap);
  }, [ouvert]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        onClick={() => setOuvert((o) => !o)}
        className="inline-flex size-11 items-center justify-center rounded-xs text-encre hover:bg-pierre-100"
      >
        {ouvert ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        <span className="sr-only">{ouvert ? "Fermer le menu" : "Ouvrir le menu"}</span>
      </button>
      <div
        id="menu-mobile"
        hidden={!ouvert}
        className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto bg-papier"
      >
        <nav aria-label="Menu" className="conteneur flex min-h-full flex-col py-6">
          <ul className="divide-y divide-pierre-200 border-y border-pierre-200">
            {navigationPrincipale.map((l, i) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-baseline justify-between py-4 font-serif text-[1.75rem] text-encre"
                >
                  {l.libelle}
                  <span className="font-mono text-xs text-pierre-500">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-pierre-700 empty:hidden">
            {liensUtilitaires.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-encre">
                  {l.libelle}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto grid gap-3 pt-10">
            <Link href={lienCandidature} className={cn(styleBouton({ taille: "lg" }))}>
              Candidater
            </Link>
            {espacesDisponibles && (
              <Link
                href="/connexion"
                className={cn(styleBouton({ variante: "contour", taille: "lg" }))}
              >
                Connexion
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
