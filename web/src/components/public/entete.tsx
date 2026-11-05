import { CircleUserRound } from "lucide-react";
import Link from "next/link";
import { Signature } from "@/components/marque/blason";
import { LienBouton } from "@/components/ui/bouton";
import { lireInstitut } from "@/features/contenu/lecture";
import { MenuMobile } from "./menu-mobile";
import { LienNavigation } from "./lien-navigation";
import {
  espacesDisponibles,
  lienCandidature,
  liensUtilitaires,
  navigationPrincipale,
} from "./navigation";

export async function Entete() {
  const institut = await lireInstitut();
  return (
    <header
      className="entete-site sticky top-0 z-40 border-b border-pierre-200 bg-papier/95 backdrop-blur-sm"
      style={{ viewTransitionName: "entete-site" }}
    >
      <div className="barre-utilitaire hidden border-b border-pierre-200 bg-encre text-white/75 lg:block">
        <div className="conteneur flex h-9 items-center justify-between font-mono text-legende tracking-wide uppercase">
          <p>{institut.statut}</p>
          <ul className="flex items-center gap-6">
            {liensUtilitaires.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.libelle}
                </Link>
              </li>
            ))}
            {institut.telephone && (
              <li>
                <a href={institut.telephoneLien} className="hover:text-white">
                  {institut.telephone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="conteneur flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link href="/" className="shrink-0">
          <span className="hidden sm:block">
            <Signature />
          </span>
          <span className="sm:hidden">
            <Signature compacte />
          </span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigationPrincipale.map((l) => (
              <li key={l.href}>
                <LienNavigation href={l.href}>{l.libelle}</LienNavigation>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          {espacesDisponibles && (
            // Sur téléphone, l'accès aux espaces reste visible dans l'en-tête (icône).
            <Link
              href="/connexion"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xs text-encre hover:bg-pierre-100 sm:hidden"
            >
              <CircleUserRound aria-hidden className="size-6" />
              <span className="sr-only">Connexion à votre espace</span>
            </Link>
          )}
          {espacesDisponibles && (
            <LienBouton
              href="/connexion"
              variante="fantome"
              taille="sm"
              className="hidden h-10 sm:inline-flex"
            >
              Connexion
            </LienBouton>
          )}
          <LienBouton href={lienCandidature} taille="sm" className="h-10 px-3 sm:px-4">
            Candidater
          </LienBouton>
          <MenuMobile />
        </div>
      </div>
    </header>
  );
}
