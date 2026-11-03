import { Check, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { BlocPage, EntetePage } from "@/components/public/entete-page";
import { LienBouton } from "@/components/ui/bouton";
import { Encadre } from "@/components/ui/elements";
import { admission, filieres, institut } from "@/contenu/institut";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Conditions, pièces du dossier et frais d'inscription pour entrer en première année à l'ISPT-Bukavu.",
};

export default function PageAdmissions() {
  return (
    <>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Admissions" }]}
        surtitre="Admissions"
        titre="Entrer en première année"
        intro="L'admission en première année de Licence est ouverte aux titulaires du diplôme d'État. Le dossier se compose de huit pièces, dont le paiement des frais d'inscription."
        photo={{
          src: "/photos/campus-entree-escalier.jpg",
          alt: "Étudiants à l'entrée d'un bâtiment du campus.",
          legende: "Entrée du campus",
          position: "50% 60%",
        }}
      />

      <BlocPage numero="01" titre="Filières ouvertes">
        <ul className="grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 sm:grid-cols-2">
          {filieres.map((f) => (
            <li key={f.slug} className="bg-papier px-5 py-4 font-serif text-xl text-encre">
              {f.nom}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-pierre-600">
          {institut.etudes.duree}, {institut.etudes.semestres} semestres, diplôme de{" "}
          {institut.etudes.diplome}.
        </p>
      </BlocPage>

      <div id="dossier" className="scroll-mt-28">
        <BlocPage numero="02" titre="Pièces du dossier" fond="blanc">
          <ol className="divide-y divide-pierre-200 border-y border-pierre-200">
            {admission.pieces.map((p, i) => (
              <li key={p} className="flex items-center gap-5 py-3.5">
                <span className="font-mono text-xs text-pierre-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-pierre-900">{p}</span>
                <Check aria-hidden className="size-4 text-ispt-600" />
              </li>
            ))}
          </ol>
        </BlocPage>
      </div>

      <BlocPage numero="03" titre="Déposer son dossier">
        <Encadre titre="Dépôt en ligne" className="mb-8">
          Le dépôt du dossier en ligne ouvre prochainement sur cette plateforme. En attendant, les
          dossiers sont reçus à l&apos;institut, {institut.adresse.rue}, Bukavu.
        </Encadre>
        <p className="leading-relaxed text-pierre-700">
          Pour toute question sur votre admission, le secrétariat répond par téléphone, par WhatsApp
          et par email.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LienBouton href={institut.contacts.telephone.lien} variante="institutionnel">
            <Phone aria-hidden /> {institut.contacts.telephone.affichage}
          </LienBouton>
          <LienBouton
            href={institut.contacts.whatsapp.lien}
            variante="contour"
            target="_blank"
            rel="noopener"
          >
            WhatsApp {institut.contacts.whatsapp.affichage}
          </LienBouton>
          <LienBouton href={`mailto:${institut.contacts.email}`} variante="contour">
            <Mail aria-hidden /> {institut.contacts.email}
          </LienBouton>
        </div>
      </BlocPage>
    </>
  );
}
