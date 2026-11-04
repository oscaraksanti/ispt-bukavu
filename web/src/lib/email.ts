import "server-only";

type Message = { a: string; sujet: string; texte: string; html?: string };

/**
 * Envoi d'emails transactionnels via Resend. Sans clé (développement), le
 * message est affiché dans la console du serveur.
 */
export async function envoyerEmail({ a, sujet, texte, html }: Message) {
  const cle = process.env.RESEND_API_KEY;
  const expediteur = process.env.EMAIL_EXPEDITEUR ?? "ISPT-Bukavu <onboarding@resend.dev>";
  // En démonstration, aucun email ne part : les adresses sont fictives.
  if (!cle || process.env.NEXT_PUBLIC_MODE_DEMO === "1") {
    console.info(`[email] à ${a} — ${sujet}\n${texte}`);
    return { envoye: false };
  }
  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: expediteur,
      to: [a],
      reply_to: process.env.EMAIL_REPONSE,
      subject: sujet,
      text: texte,
      html,
    }),
  });
  if (!reponse.ok) {
    console.error("[email] échec d'envoi", reponse.status, await reponse.text());
    return { envoye: false };
  }
  return { envoye: true };
}

/** Adresse publique du site, pour les liens envoyés par email. */
export function urlSite() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
