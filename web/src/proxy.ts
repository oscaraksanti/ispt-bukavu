import { NextResponse, type NextRequest } from "next/server";

/**
 * Contrôle optimiste : sans cookie de session, inutile de rendre une page
 * protégée. La vérification réelle (session valide, permissions) est faite
 * côté serveur dans chaque page et chaque action.
 */
export function proxy(requete: NextRequest) {
  if (!requete.cookies.has("ispt_session")) {
    const url = new URL("/connexion", requete.url);
    url.searchParams.set("suite", requete.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
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
