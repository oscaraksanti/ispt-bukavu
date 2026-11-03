import type { Metadata } from "next";
import { CalendarDays, Info, Search } from "lucide-react";
import { Blason, Signature } from "@/components/marque/blason";
import { Bouton } from "@/components/ui/bouton";
import { Case, Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import {
  Chiffre,
  EnteteSection,
  Encadre,
  Etiquette,
  EtatVide,
  FilAriane,
  FiletCote,
  LienFleche,
  Squelette,
} from "@/components/ui/elements";

export const metadata: Metadata = {
  title: "Système de design",
  robots: { index: false },
};

const couleurs = [
  { nom: "Bleu ISPT", classe: "bg-ispt-600", valeur: "#283890" },
  { nom: "Encre", classe: "bg-encre", valeur: "#141B4A" },
  { nom: "Jaune chantier", classe: "bg-chantier", valeur: "#FEF200" },
  { nom: "Rouge", classe: "bg-rouge", valeur: "#E31D2F" },
  { nom: "Violet devise", classe: "bg-devise", valeur: "#612D89" },
  { nom: "Papier", classe: "bg-papier border border-pierre-200", valeur: "#F7F6F2" },
];

const nuances = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const classesIspt = [
  "bg-ispt-50",
  "bg-ispt-100",
  "bg-ispt-200",
  "bg-ispt-300",
  "bg-ispt-400",
  "bg-ispt-500",
  "bg-ispt-600",
  "bg-ispt-700",
  "bg-ispt-800",
  "bg-ispt-900",
];
const classesPierre = [
  "bg-pierre-50",
  "bg-pierre-100",
  "bg-pierre-200",
  "bg-pierre-300",
  "bg-pierre-400",
  "bg-pierre-500",
  "bg-pierre-600",
  "bg-pierre-700",
  "bg-pierre-800",
  "bg-pierre-900",
];

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-pierre-200 py-12">
      <h2 className="surtitre !font-mono">{titre}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function SystemeDeDesign() {
  return (
    <main className="conteneur py-16">
      <EnteteSection
        niveau="h1"
        numero="00"
        surtitre="Référence"
        titre="Système de design"
        intro="Couleurs, typographie et composants de la plateforme de l'ISPT-Bukavu."
      />

      <Bloc titre="Blason">
        <div className="flex flex-wrap items-end gap-10">
          <Blason devise hauteur={160} />
          <Blason variante="monochrome" devise hauteur={160} />
          <div className="bg-encre p-4">
            <Blason variante="blanc" devise hauteur={160} />
          </div>
          <Signature />
          <div className="bg-encre p-4">
            <Signature clair />
          </div>
        </div>
      </Bloc>

      <Bloc titre="Couleurs">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {couleurs.map((c) => (
            <div key={c.nom}>
              <div className={`h-20 rounded-md ${c.classe}`} />
              <p className="mt-2 text-sm font-medium">{c.nom}</p>
              <p className="font-mono text-xs text-pierre-500">{c.valeur}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-10 gap-1">
          {nuances.map((n, i) => (
            <div key={n} className="text-center">
              <div className={`h-10 rounded-xs ${classesIspt[i]}`} />
              <p className="mt-1 font-mono text-[0.625rem] text-pierre-500">{n}</p>
            </div>
          ))}
          {nuances.map((n, i) => (
            <div key={`p${n}`} className="text-center">
              <div className={`h-10 rounded-xs ${classesPierre[i]}`} />
              <p className="mt-1 font-mono text-[0.625rem] text-pierre-500">{n}</p>
            </div>
          ))}
        </div>
      </Bloc>

      <Bloc titre="Typographie">
        <div className="space-y-6">
          <p className="font-serif text-6xl text-encre">Former les bâtisseurs</p>
          <p className="font-serif text-4xl text-encre italic">Scientia splendet et conscientia</p>
          <p className="font-serif text-2xl text-encre">Titre de niveau trois</p>
          <p className="max-w-2xl text-[1.0625rem] leading-relaxed text-pierre-700">
            IBM Plex Sans pour le texte courant : l&apos;Institut Supérieur Pédagogique et Technique
            de Bukavu forme des ingénieurs en techniques appliquées, aptes à intégrer les
            entreprises et à enseigner dans les établissements techniques.
          </p>
          <p className="font-mono text-sm text-pierre-700">
            ISPT-2025-0142 · 02°30&apos;09&quot; S · 28°52&apos;18&quot; E · 08:00 — 12:00
          </p>
        </div>
      </Bloc>

      <Bloc titre="Boutons et liens">
        <div className="flex flex-wrap items-center gap-3">
          <Bouton>Déposer ma candidature</Bouton>
          <Bouton variante="institutionnel">Se connecter</Bouton>
          <Bouton variante="contour">Télécharger le dépliant</Bouton>
          <Bouton variante="fantome">Annuler</Bouton>
          <Bouton variante="danger">Révoquer</Bouton>
          <Bouton taille="sm" variante="contour">
            <Search aria-hidden /> Rechercher
          </Bouton>
          <Bouton disabled>Indisponible</Bouton>
          <LienFleche href="/">Découvrir les filières</LienFleche>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 bg-encre p-6">
          <Bouton>Candidater</Bouton>
          <Bouton variante="inverse">Voir la galerie</Bouton>
        </div>
      </Bloc>

      <Bloc titre="Étiquettes et encadrés">
        <div className="flex flex-wrap gap-2">
          <Etiquette>Brouillon</Etiquette>
          <Etiquette ton="ispt">Génie Informatique</Etiquette>
          <Etiquette ton="succes">Publiée</Etiquette>
          <Etiquette ton="attention">Complément demandé</Etiquette>
          <Etiquette ton="erreur">Refusée</Etiquette>
          <Etiquette ton="chantier">Nouveau</Etiquette>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Encadre titre="Campagne d'admission ouverte" icone={<Info />}>
            Les candidatures pour l&apos;année académique sont reçues jusqu&apos;à la date de
            clôture.
          </Encadre>
          <Encadre ton="succes" titre="Candidature soumise">
            Votre dossier a bien été transmis.
          </Encadre>
          <Encadre ton="attention" titre="Pièce manquante">
            Le bulletin de 6e humanités n&apos;a pas encore été déposé.
          </Encadre>
          <Encadre ton="erreur" titre="Échec de l'envoi">
            Le fichier dépasse la taille autorisée (5 Mo).
          </Encadre>
        </div>
      </Bloc>

      <Bloc titre="Champs de formulaire">
        <form className="grid max-w-2xl gap-5 sm:grid-cols-2">
          <Champ id="nom" libelle="Nom" obligatoire>
            <Saisie id="nom" placeholder="Nom de famille" />
          </Champ>
          <Champ id="postnom" libelle="Post-nom">
            <Saisie id="postnom" />
          </Champ>
          <Champ id="filiere" libelle="Filière souhaitée" obligatoire className="sm:col-span-2">
            <Liste id="filiere" defaultValue="">
              <option value="" disabled>
                Choisir une filière
              </option>
              <option>Électromécanique</option>
              <option>Génie Informatique</option>
              <option>Électronique et Télécommunications</option>
              <option>Génie Civil (BTP)</option>
            </Liste>
          </Champ>
          <Champ
            id="pourcentage"
            libelle="Pourcentage à l'examen d'État"
            erreur="Saisissez un pourcentage entre 50 et 100."
          >
            <Saisie id="pourcentage" inputMode="decimal" aria-invalid defaultValue="120" />
          </Champ>
          <Champ id="tel" libelle="Téléphone" aide="Format : 099 000 0000">
            <Saisie id="tel" type="tel" />
          </Champ>
          <Champ id="message" libelle="Message" className="sm:col-span-2">
            <ZoneTexte id="message" />
          </Champ>
          <label className="flex items-start gap-3 text-sm text-pierre-700 sm:col-span-2">
            <Case className="mt-0.5" />
            J&apos;accepte que mes données soient traitées pour l&apos;examen de ma candidature.
          </label>
        </form>
      </Bloc>

      <Bloc titre="Données">
        <div className="grid gap-8 sm:grid-cols-3">
          <Chiffre valeur="2010" libelle="Année de création" detail="Arrêté n°219/MINESU" />
          <Chiffre valeur="4" libelle="Filières LMD" />
          <Chiffre valeur="8" libelle="Semestres" detail="Licence en 4 ans" />
        </div>
        <div className="mt-10 bg-encre p-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <Chiffre clair valeur="2011" libelle="Opérationnel depuis" />
            <Chiffre clair valeur="2" libelle="Types de stage" />
            <Chiffre clair valeur="10 $" libelle="Frais de dossier" />
          </div>
        </div>
      </Bloc>

      <Bloc titre="Navigation et états">
        <FilAriane
          elements={[
            { libelle: "Accueil", href: "/" },
            { libelle: "Formations", href: "/" },
            { libelle: "Génie Civil" },
          ]}
        />
        <div className="mt-6 flex items-center gap-4">
          <FiletCote />
          <span className="font-mono text-xs text-pierre-500">filet de cote</span>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Squelette className="h-4 w-1/3" />
            <Squelette className="h-4 w-full" />
            <Squelette className="h-4 w-5/6" />
          </div>
          <EtatVide
            icone={<CalendarDays />}
            titre="Aucune séance cette semaine"
            description="L'horaire de votre promotion sera affiché dès sa publication."
          />
        </div>
      </Bloc>
    </main>
  );
}
