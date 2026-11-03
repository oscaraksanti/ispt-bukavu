import { cacheLife } from "next/cache";
import Link from "next/link";
import { Blason } from "@/components/marque/blason";
import { filieres, institut } from "@/contenu/institut";
import { liensUtilitaires, navigationPrincipale } from "./navigation";

export async function PiedDePage() {
  "use cache";
  cacheLife("days");
  const annee = new Date().getFullYear();
  return (
    <footer className="trame-claire mt-auto bg-encre text-white/70">
      <div className="conteneur grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Blason variante="blanc" devise hauteur={112} />
          <p className="mt-6 max-w-xs font-serif text-xl leading-snug text-white">{institut.nom}</p>
          <p className="mt-3 text-sm">{institut.statut}.</p>
        </div>

        <div className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
          <div>
            <h2 className="surtitre !font-mono text-chantier">Institut</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {navigationPrincipale.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.libelle}
                  </Link>
                </li>
              ))}
              {liensUtilitaires.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="surtitre !font-mono text-chantier">Formations</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {filieres.map((f) => (
                <li key={f.slug}>
                  <Link href={`/formations/${f.slug}`} className="hover:text-white">
                    {f.nomCourt}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="surtitre !font-mono text-chantier">Nous trouver</h2>
            <address className="mt-4 space-y-2.5 text-sm not-italic">
              <p>
                {institut.adresse.rue}
                <br />
                {institut.adresse.quartier}, {institut.adresse.commune}
                <br />
                {institut.adresse.ville}, {institut.adresse.province}
              </p>
              <p>
                <a href={institut.contacts.telephone.lien} className="hover:text-white">
                  {institut.contacts.telephone.affichage}
                </a>
                <br />
                <a href={`mailto:${institut.contacts.email}`} className="hover:text-white">
                  {institut.contacts.email}
                </a>
              </p>
            </address>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="conteneur flex flex-col gap-2 py-6 font-mono text-[0.6875rem] tracking-wide text-white/50 uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {annee} {institut.sigle} · {institut.creation.acte}
          </p>
          <p>{institut.coordonnees.libelle}</p>
        </div>
      </div>
    </footer>
  );
}
