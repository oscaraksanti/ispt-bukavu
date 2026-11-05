import { cacheLife } from "next/cache";
import Link from "next/link";
import { Blason } from "@/components/marque/blason";
import { majuscule } from "@/lib/cn";
import { lireFilieres, lireInstitut } from "@/features/contenu/lecture";
import {
  espacesDisponibles,
  lienCandidature,
  liensLegaux,
  liensUtilitaires,
  navigationPrincipale,
} from "./navigation";

export async function PiedDePage() {
  "use cache";
  cacheLife("days");
  const annee = new Date().getFullYear();
  const [institut, filieres] = await Promise.all([lireInstitut(), lireFilieres()]);
  const colonnes = [
    { titre: "Institut", liens: navigationPrincipale },
    { titre: "Ressources", liens: liensUtilitaires },
    {
      titre: "Formations",
      liens: filieres.map((f) => ({ libelle: f.nomCourt, href: `/formations/${f.slug}` })),
    },
    {
      titre: "Espaces",
      liens: [
        { libelle: "Candidater", href: lienCandidature },
        ...(espacesDisponibles
          ? [
              { libelle: "Connexion", href: "/connexion" },
              { libelle: "Activer mon compte étudiant", href: "/activer" },
            ]
          : []),
      ],
    },
  ];
  return (
    <footer className="trame-claire mt-auto bg-encre text-white/70">
      <div className="conteneur grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Blason variante="blanc" devise hauteur={112} />
          <p className="mt-6 max-w-xs font-serif text-xl leading-snug text-white">{institut.nom}</p>
          <p className="mt-3 text-sm">{institut.statut}.</p>
          <address className="mt-8 space-y-1 text-sm not-italic">
            <p>
              {institut.rue}, {majuscule(institut.quartier)}
              <br />
              {institut.commune} · {institut.ville}, {institut.province}
            </p>
            {institut.telephone && (
              <a href={institut.telephoneLien} className="inline-block py-1 hover:text-white">
                {institut.telephone}
              </a>
            )}
            {institut.email && (
              <>
                <br />
                <a href={`mailto:${institut.email}`} className="inline-block py-1 hover:text-white">
                  {institut.email}
                </a>
              </>
            )}
          </address>
          {institut.coordonnees && (
            <p className="mt-4 font-mono text-legende tracking-wide text-white/50 uppercase">
              {institut.coordonnees}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:col-span-8">
          {colonnes.map((c) => (
            <div key={c.titre}>
              <h2 className="surtitre !font-mono text-chantier">{c.titre}</h2>
              <ul className="mt-4 space-y-1 text-sm">
                {c.liens.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-block py-1.5 hover:text-white">
                      {l.libelle}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="conteneur flex flex-col gap-2 py-6 font-mono text-legende tracking-wide text-white/65 uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {annee} {institut.sigle} · {institut.acteCreation}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {liensLegaux.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-block py-1 hover:text-white">
                  {l.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
