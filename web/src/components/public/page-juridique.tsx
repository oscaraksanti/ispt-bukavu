import { EntetePage } from "@/components/public/entete-page";
import { TexteArticle } from "@/components/public/texte-article";
import { TransitionPage } from "@/components/public/transition-page";
import { lireInstitut, lirePage } from "@/features/contenu/lecture";
import { lecteur } from "@/features/contenu/lecteur";

/**
 * Page juridique administrable. Le texte doit venir de l'institut : tant
 * qu'il n'est pas saisi, la page le dit clairement plutôt que d'afficher un
 * texte juridique qui n'aurait pas été validé.
 */
export async function PageJuridique({ slug, titre }: { slug: string; titre: string }) {
  const [page, institut] = await Promise.all([lirePage(slug), lireInstitut()]);
  const bloc = lecteur(page.texte);
  const texte = bloc.texte("texte").trim();
  const miseAJour = bloc.texte("miseAJour").trim();
  return (
    <TransitionPage>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: titre }]}
        surtitre="Informations légales"
        titre={titre}
      />
      <section className="conteneur py-14 lg:py-20">
        <div className="max-w-3xl">
          {texte ? (
            <>
              <TexteArticle texte={texte} />
              {miseAJour && (
                <p className="mt-10 font-mono text-xs text-pierre-600">
                  Dernière mise à jour : {miseAJour}
                </p>
              )}
            </>
          ) : (
            <div className="rounded-md border border-pierre-200 bg-white p-6">
              <p className="text-lg text-pierre-800">
                Ce texte est en cours de validation par l&apos;institut et sera publié ici
                prochainement.
              </p>
              <p className="mt-3 text-pierre-600">
                Pour toute question, écrivez à{" "}
                <a href={`mailto:${institut.email}`} className="text-ispt-700 underline">
                  {institut.email}
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </section>
    </TransitionPage>
  );
}
