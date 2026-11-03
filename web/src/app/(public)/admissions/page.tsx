import { TransitionPage } from "@/components/public/transition-page";
import { Check, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { BlocPage, EntetePage } from "@/components/public/entete-page";
import { LienBouton } from "@/components/ui/bouton";
import { Encadre } from "@/components/ui/elements";
import { lireFaq, lireFilieres, lireInstitut, lirePage } from "@/features/contenu/lecture";
import { lecteur } from "@/features/contenu/lecteur";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Conditions, pièces du dossier et frais d'inscription pour entrer en première année à l'ISPT-Bukavu.",
};

export default async function PageAdmissions() {
  const [page, institut, filieres, faq] = await Promise.all([
    lirePage("admissions"),
    lireInstitut(),
    lireFilieres(),
    lireFaq("admissions"),
  ]);
  const entete = lecteur(page.entete);
  const pieces = lecteur(page.pieces);
  const depot = lecteur(page.depot);
  return (
    <TransitionPage>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Admissions" }]}
        surtitre="Admissions"
        titre={entete.texte("titre")}
        intro={entete.texte("intro")}
        photo={entete.image("photo")}
        legende={entete.texte("legende")}
        position="50% 60%"
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
          {institut.dureeEtudes}, {institut.semestres} semestres, diplôme de {institut.diplome}.
        </p>
      </BlocPage>

      <div id="dossier" className="scroll-mt-28">
        <BlocPage numero="02" titre="Pièces du dossier" fond="blanc">
          <ol className="divide-y divide-pierre-200 border-y border-pierre-200">
            {pieces.liste("liste").map((p, i) => (
              <li key={i} className="flex items-center gap-5 py-3.5">
                <span className="font-mono text-xs text-pierre-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-pierre-900">{p.texte("libelle")}</span>
                <Check aria-hidden className="size-4 text-ispt-600" />
              </li>
            ))}
          </ol>
        </BlocPage>
      </div>

      <BlocPage numero="03" titre="Déposer son dossier">
        {depot.texte("texteEncadre") && (
          <Encadre titre={depot.texte("titreEncadre")} className="mb-8">
            {depot.texte("texteEncadre")}
          </Encadre>
        )}
        <p className="leading-relaxed text-pierre-700">{depot.texte("texte")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {institut.telephone && (
            <LienBouton href={institut.telephoneLien} variante="institutionnel">
              <Phone aria-hidden /> {institut.telephone}
            </LienBouton>
          )}
          {institut.whatsapp && (
            <LienBouton
              href={institut.whatsappLien}
              variante="contour"
              target="_blank"
              rel="noopener"
            >
              WhatsApp {institut.whatsapp}
            </LienBouton>
          )}
          {institut.email && (
            <LienBouton href={`mailto:${institut.email}`} variante="contour">
              <Mail aria-hidden /> {institut.email}
            </LienBouton>
          )}
        </div>
      </BlocPage>
      {faq.length > 0 && (
        <BlocPage numero="04" titre="Questions fréquentes" fond="blanc">
          <div className="divide-y divide-pierre-200 border-y border-pierre-200">
            {faq.map((q) => (
              <details key={q.id} className="group py-1">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 font-serif text-xl text-encre [&::-webkit-details-marker]:hidden">
                  {q.question}
                  <span
                    aria-hidden
                    className="mt-1 font-sans text-xl leading-none text-ispt-600 transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 leading-relaxed whitespace-pre-line text-pierre-700">
                  {q.reponse}
                </p>
              </details>
            ))}
          </div>
        </BlocPage>
      )}
    </TransitionPage>
  );
}
