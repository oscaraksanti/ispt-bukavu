import { NextResponse, type NextRequest } from "next/server";
import { DOMAINE_NU, HSTS } from "@/lib/hsts";

/**
 * Contrôle optimiste : sans cookie de session, inutile de rendre une page
 * protégée. La vérification réelle (session valide, permissions) est faite
 * côté serveur dans chaque page et chaque action.
 */
export function proxy(requete: NextRequest) {
  // Domaine nu → adresse officielle, avec l'en-tête HSTS complet (exigé pour le
  // préchargement : une redirection faite par l'hébergeur ne le porte pas).
  if (requete.headers.get("host") === DOMAINE_NU) {
    const cible = new URL(
      requete.nextUrl.pathname + requete.nextUrl.search,
      `https://www.${DOMAINE_NU}`,
    );
    const reponse = NextResponse.redirect(cible, 308);
    reponse.headers.set("Strict-Transport-Security", HSTS);
    return reponse;
  }
  if (!requete.cookies.has("ispt_session")) {
    const url = new URL("/connexion", requete.url);
    url.searchParams.set("suite", requete.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Toutes les adresses du domaine nu (redirection ci-dessus) ; le site « www » n'est pas concerné.
    { source: "/:path*", has: [{ type: "header", key: "host", value: "isptbukavu.org" }] },
    "/admin/:path*",
    "/etudiant/:path*",
    "/enseignant/:path*",
    "/candidat/:path*",
    "/recu/:path*",
    "/recu-dossier/:path*",
    "/affiche/:path*",
    "/examens/:path*",
    "/documents/:path*",
    "/deliberations/:path*",
    "/compte/:path*",
    "/messages/:path*",
    "/campus/:path*",
  ],
};
