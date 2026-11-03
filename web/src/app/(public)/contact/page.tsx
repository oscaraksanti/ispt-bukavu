import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Carte } from "@/components/public/carte";
import { EntetePage } from "@/components/public/entete-page";
import { majuscule } from "@/lib/cn";
import { institut } from "@/contenu/institut";

export const metadata: Metadata = {
  title: "Contact",
  description: "Adresse, téléphone, WhatsApp et email de l'ISPT-Bukavu.",
};

const { latitude: lat, longitude: lon } = institut.coordonnees;
const delta = 0.004;
const carte = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lon}`;
const itineraire = `https://www.openstreetmap.org/directions?to=${lat}%2C${lon}#map=17/${lat}/${lon}`;

export default function PageContact() {
  const moyens = [
    {
      icone: Phone,
      libelle: "Téléphone",
      valeur: institut.contacts.telephone.affichage,
      href: institut.contacts.telephone.lien,
    },
    {
      icone: MessageCircle,
      libelle: "WhatsApp",
      valeur: institut.contacts.whatsapp.affichage,
      href: institut.contacts.whatsapp.lien,
    },
    {
      icone: Mail,
      libelle: "Email",
      valeur: institut.contacts.email,
      href: `mailto:${institut.contacts.email}`,
    },
  ];

  return (
    <>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Contact" }]}
        surtitre="Contact"
        titre="Nous écrire, nous appeler, nous rendre visite"
      />
      <section className="conteneur grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <h2 className="text-3xl">Adresse</h2>
          <address className="mt-4 text-lg leading-relaxed text-pierre-800 not-italic">
            {institut.adresse.rue}
            <br />
            {majuscule(institut.adresse.quartier)}, {institut.adresse.commune}
            <br />
            {institut.adresse.ville}, {institut.adresse.province}
            <br />
            {institut.adresse.pays}
          </address>
          <p className="mt-3 text-pierre-600">{institut.adresse.reperes}.</p>
          <p className="mt-1 text-pierre-600">{institut.adresse.boitePostale}</p>
          <p className="mt-4 font-mono text-sm text-ispt-600">{institut.coordonnees.libelle}</p>

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
          <Carte src={carte} libelle={institut.coordonnees.libelle} />
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
    </>
  );
}
