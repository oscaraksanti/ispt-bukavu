import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Carte } from "@/components/public/carte";
import { BlocPage, EntetePage } from "@/components/public/entete-page";
import { FormulaireContact } from "@/components/public/formulaire-contact";
import { majuscule } from "@/lib/cn";
import { lireInstitut, lirePage } from "@/features/contenu/lecture";
import { lecteur } from "@/features/contenu/lecteur";

export const metadata: Metadata = {
  title: "Contact",
  description: "Adresse, téléphone, WhatsApp et email de l'ISPT-Bukavu.",
};

const DELTA = 0.004;

export default async function PageContact() {
  const [page, institut] = await Promise.all([lirePage("contact"), lireInstitut()]);
  const entete = lecteur(page.entete);
  const { latitudeNombre: lat, longitudeNombre: lon } = institut;
  const carte = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - DELTA}%2C${lat - DELTA}%2C${lon + DELTA}%2C${lat + DELTA}&layer=mapnik&marker=${lat}%2C${lon}`;
  const itineraire = `https://www.openstreetmap.org/directions?to=${lat}%2C${lon}#map=17/${lat}/${lon}`;
  const moyens = [
    {
      icone: Phone,
      libelle: "Téléphone",
      valeur: institut.telephone,
      href: institut.telephoneLien,
    },
    {
      icone: MessageCircle,
      libelle: "WhatsApp",
      valeur: institut.whatsapp,
      href: institut.whatsappLien,
    },
    { icone: Mail, libelle: "Email", valeur: institut.email, href: `mailto:${institut.email}` },
  ].filter((m) => m.valeur);

  return (
    <>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Contact" }]}
        surtitre="Contact"
        titre={entete.texte("titre")}
      />
      <section className="conteneur grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <h2 className="text-3xl">Adresse</h2>
          <address className="mt-4 text-lg leading-relaxed text-pierre-800 not-italic">
            {institut.rue}
            <br />
            {majuscule(institut.quartier)}, {institut.commune}
            <br />
            {institut.ville}, {institut.province}
            <br />
            {institut.pays}
          </address>
          {institut.reperes && <p className="mt-3 text-pierre-600">{institut.reperes}.</p>}
          {institut.boitePostale && <p className="mt-1 text-pierre-600">{institut.boitePostale}</p>}
          <p className="mt-4 font-mono text-sm text-ispt-600">{institut.coordonnees}</p>

          <ul className="mt-10 divide-y divide-pierre-200 border-y border-pierre-200">
            {moyens.map(({ icone: Icone, libelle, valeur, href }) => (
              <li key={libelle}>
                <a
                  href={href}
                  className="group flex items-center gap-4 py-4"
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                >
                  <span className="flex size-10 items-center justify-center rounded-xs bg-ispt-50 text-ispt-600">
                    <Icone aria-hidden className="size-4" />
                  </span>
                  <span>
                    <span className="block font-mono text-xs tracking-wide text-pierre-500 uppercase">
                      {libelle}
                    </span>
                    <span className="text-lg text-encre group-hover:text-ispt-600">{valeur}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-7">
          <Carte src={carte} libelle={institut.coordonnees} />
          <a
            href={itineraire}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ispt-600 hover:underline"
          >
            <MapPin aria-hidden className="size-4" />
            Calculer un itinéraire
          </a>
        </div>
      </section>
      <BlocPage numero="Écrire" titre="Envoyer un message au secrétariat" fond="blanc">
        <FormulaireContact />
      </BlocPage>
    </>
  );
}
