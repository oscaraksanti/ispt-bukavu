import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireActivation } from "./formulaire";

export const metadata: Metadata = {
  title: "Activer mon compte étudiant",
  robots: { index: false },
};

export default function PageActivation() {
  return (
    <>
      <p className="surtitre">Espace étudiant</p>
      <h1 className="mt-3 text-titre-page">Activer mon compte</h1>
      <p className="mt-3 text-pierre-600">
        Saisissez votre matricule et le code remis par le secrétariat, puis choisissez votre mot de
        passe. Vous vous connecterez ensuite avec votre matricule.
      </p>
      <div className="mt-8">
        <FormulaireActivation />
      </div>
      <p className="mt-6 text-center text-sm">
        Compte déjà activé ?{" "}
        <Link href="/connexion" className="text-ispt-600 underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </>
  );
}
