import { relaisSentry } from "@/lib/surveillance";

/**
 * Relais des rapports d'erreur du navigateur vers Sentry. Le navigateur n'écrit
 * qu'au site lui-même (politique de sécurité inchangée, bloqueurs de publicité
 * sans effet) ; le relais n'accepte que des envois destinés au projet configuré.
 */
export async function POST(requete: Request) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return new Response(null, { status: 404 });

  const longueur = Number(requete.headers.get("content-length") ?? 0);
  if (longueur > TAILLE_MAX) return new Response(null, { status: 413 });
  const enveloppe = await requete.text();
  if (enveloppe.length > TAILLE_MAX) return new Response(null, { status: 413 });

  const cible = relaisSentry(enveloppe, dsn);
  if (!cible) return new Response(null, { status: 400 });

  const reponse = await fetch(cible, {
    method: "POST",
    body: enveloppe,
    headers: { "Content-Type": "application/x-sentry-envelope" },
  }).catch(() => null);
  return new Response(null, { status: reponse?.ok ? 200 : 502 });
}

const TAILLE_MAX = 500_000;
