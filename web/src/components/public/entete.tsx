import Link from "next/link";
import { Signature } from "@/components/marque/blason";
import { LienBouton } from "@/components/ui/bouton";
import { institut } from "@/contenu/institut";
import { MenuMobile } from "./menu-mobile";
import { LienNavigation } from "./lien-navigation";
import { liensUtilitaires, navigationPrincipale } from "./navigation";

export function Entete() {
  return (
    <header className="sticky top-0 z-40 border-b border-pierre-200 bg-papier/95 backdrop-blur-sm">
      <div className="hidden border-b border-pierre-200 bg-encre text-white/75 lg:block">
        <div className="conteneur flex h-9 items-center justify-between font-mono text-[0.6875rem] tracking-wide uppercase">
          <p>{institut.statut}</p>
          <ul className="flex items-center gap-6">
            {liensUtilitaires.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.libelle}
                </Link>
              </li>
            ))}
            <li>
              <a href={institut.contacts.telephone.lien} className="hover:text-white">
                {institut.contacts.telephone.affichage}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="conteneur flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link href="/" aria-label="ISPT-Bukavu, accueil" className="shrink-0">
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
        <div className="flex items-center gap-2">
          <LienBouton
            href="/connexion"
            variante="fantome"
            taille="sm"
            className="hidden h-10 sm:inline-flex"
          >
            Connexion
          </LienBouton>
          <LienBouton
            href="/admissions/candidater"
            taille="sm"
            className="hidden h-10 sm:inline-flex"
          >
            Candidater
          </LienBouton>
          <MenuMobile />
        </div>
      </div>
    </header>
  );
}
