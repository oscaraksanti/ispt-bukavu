import "server-only";

type Message = { a: string; sujet: string; texte: string; html?: string };

/**
 * Envoi d'emails transactionnels via Resend. Sans clé (développement), le
 * message est affiché dans la console du serveur.
 */
export async function envoyerEmail({ a, sujet, texte, html }: Message) {
  const cle = process.env.RESEND_API_KEY;
  const expediteur = process.env.EMAIL_EXPEDITEUR ?? "ISPT-Bukavu <onboarding@resend.dev>";
  if (!cle) {
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

export function urlSite() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
